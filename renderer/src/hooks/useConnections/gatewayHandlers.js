import { CAPS } from '../../irc/constants.js';
import { splitAutoJoin } from '../../irc/auto_join.js';
import {
	addSystemMessage,
	applyIrcEvent,
	clearChannelUsersOnDisconnect,
	STATUS_TARGET,
	withStatus,
} from '../../irc/state.js';
import {
	buildNickCandidate,
	createNickRetryState,
	HISTORY_SUPPRESSED_COMMANDS,
	MAX_NICK_RETRIES,
	shouldSuppressHistory,
} from './helpers.js';

const shouldSuppressBlockedMessage = (message, isBlocked) => {
	if (!isBlocked || !message) {
		return false;
	}

	if (message.command !== 'PRIVMSG' && message.command !== 'NOTICE') {
		return false;
	}

	const fromNick = message.prefix?.nick;
	if (!fromNick) {
		return false;
	}

	return isBlocked(fromNick);
};

const createGatewayMessageHandler = ({
	connectionId,
	settings,
	clientCert,
	clientKey,
	sendMessage,
	updateChatState,
	addStatusNote,
	onIrcEventRef,
	isBlocked,
	pendingJoinsRef,
	nickRetryRef,
	rejoinTargetsRef,
	connectedAtRef,
}) => (event) => {
	let message;

	try {
		message = JSON.parse(event.data);
	} catch {
		addStatusNote(connectionId, 'Received invalid JSON from gateway.');
		return;
	}

	if (message.type === 'hello') {
		updateChatState(connectionId, (prev) =>
			withStatus(prev, 'connecting', '')
		);
		const port = Number.parseInt(settings.port || '6697', 10);
		const payload = {
			type: 'connect',
			connId: settings.connId,
			host: settings.host,
			port: Number.isNaN(port) ? 6697 : port,
			tls: true,
			nick: settings.nick,
			username: settings.username,
			realname: settings.realname,
			caps: CAPS,
			options: { receiveRaw: Boolean(settings.receiveRaw) },
		};

		if (settings.saslMethod === 'PLAIN') {
			payload.sasl = {
				method: 'PLAIN',
				password: settings.saslPassword,
			};
		}

		if (settings.saslMethod === 'EXTERNAL') {
			payload.sasl = { method: 'EXTERNAL' };
			payload.clientCert = clientCert;
			payload.clientKey = clientKey;
		}

		sendMessage(connectionId, payload);
	}

	if (message.type === 'connected') {
		connectedAtRef.current[connectionId] = Date.now();
		const retryState = nickRetryRef.current[connectionId];
		const currentNick = retryState?.lastNick || settings.nick;
		updateChatState(connectionId, (prev) => ({
			...withStatus(prev, 'connected', ''),
			server: message.server || prev.server,
			me: currentNick || prev.me,
			capEnabled: Array.isArray(message.capEnabled)
				? message.capEnabled
				: prev.capEnabled,
		}));
		addStatusNote(
			connectionId,
			`Connected to IRC server ${message.server || settings.host}.`
		);
		if (currentNick) {
			nickRetryRef.current[connectionId] = createNickRetryState(
				currentNick,
				false
			);
		}

		const joinSet = new Set();
		const joinTargets = [];
		const addJoinTarget = (channel) => {
			if (!channel) {
				return;
			}
			const key = channel.toLowerCase();
			if (joinSet.has(key)) {
				return;
			}
			joinSet.add(key);
			joinTargets.push(channel);
		};

		splitAutoJoin(settings.autoJoin).forEach(addJoinTarget);

		const rejoinTargets =
			rejoinTargetsRef?.current?.[connectionId] || new Set();
		if (Array.isArray(rejoinTargets)) {
			rejoinTargets.forEach(addJoinTarget);
		} else if (rejoinTargets instanceof Set) {
			rejoinTargets.forEach(addJoinTarget);
		}
		if (rejoinTargetsRef?.current) {
			rejoinTargetsRef.current[connectionId] = new Set();
		}

		joinTargets.forEach((channel) => {
			sendMessage(connectionId, {
				type: 'irc_send',
				connId: settings.connId,
				line: `JOIN ${channel}`,
			});
		});
	}

	if (message.type === 'disconnected') {
		updateChatState(connectionId, (prev) => {
			const clearedState = clearChannelUsersOnDisconnect(prev);
			return withStatus(clearedState, 'closed', '');
		});
		addStatusNote(
			connectionId,
			`Disconnected from IRC (${message.reason || 'unknown'}).`
		);
	}

	if (message.type === 'error') {
		updateChatState(connectionId, (prev) =>
			withStatus(prev, 'error', message.message || 'Gateway error')
		);
		addStatusNote(
			connectionId,
			`Gateway error: ${message.message || message.code || 'unknown'}`
		);
	}

	if (message.type === 'irc_event') {
		if (onIrcEventRef.current) {
			onIrcEventRef.current(connectionId, message);
		}

		const connectedAt = connectedAtRef.current[connectionId];
		if (
			HISTORY_SUPPRESSED_COMMANDS.has(message.command) &&
			shouldSuppressHistory(message, connectedAt)
		) {
			return;
		}

		if (shouldSuppressBlockedMessage(message, isBlocked)) {
			return;
		}
		if (message.command === '433') {
			const currentState =
				nickRetryRef.current[connectionId] ||
				createNickRetryState(settings.nick, true);
			if (currentState.active) {
				const nextAttempt = currentState.attempt + 1;
				if (nextAttempt <= MAX_NICK_RETRIES) {
					const nextNick = buildNickCandidate(
						currentState.baseNick,
						nextAttempt
					);
					if (nextNick) {
						nickRetryRef.current[connectionId] = {
							...currentState,
							attempt: nextAttempt,
							lastNick: nextNick,
						};
						addStatusNote(
							connectionId,
							`Nick in use. Trying ${nextNick}...`
						);
						updateChatState(connectionId, (prev) => ({
							...prev,
							me: nextNick,
						}));
						sendMessage(connectionId, {
							type: 'irc_send',
							connId: settings.connId,
							line: `NICK ${nextNick}`,
						});
					}
				} else {
					addStatusNote(
						connectionId,
						'Nick in use and auto-retries exhausted. Please pick a new nick.'
					);
				}
			}
		}

		if (message.command === '001') {
			const confirmedNick = message.params?.[0];
			if (confirmedNick) {
				nickRetryRef.current[connectionId] = createNickRetryState(
					confirmedNick,
					false
				);
				updateChatState(connectionId, (prev) => ({
					...prev,
					me: confirmedNick,
				}));
			}
		}

		if (message.command === 'JOIN') {
			updateChatState(connectionId, (prev) => {
				const channel = message.target || message.params?.[0];
				const nick = message.prefix?.nick || '';
				const isSelf = nick && nick === prev.me;
				const pending = pendingJoinsRef.current[connectionId];
				const wasRequested = channel && pending && pending.has(channel);
				if (wasRequested) {
					pending.delete(channel);
					return applyIrcEvent(prev, message);
				}

				if (isSelf && channel) {
					const next = applyIrcEvent(prev, message);
					return addSystemMessage(
						next,
						STATUS_TARGET,
						`Server auto-joined you to ${channel}.`
					);
				}

				return applyIrcEvent(prev, message);
			});
			return;
		}

		updateChatState(connectionId, (prev) => applyIrcEvent(prev, message));
	}
};

export { createGatewayMessageHandler };
