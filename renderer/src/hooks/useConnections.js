import { useRef, useState, useEffect } from 'react';
import { CAPS } from '../irc/constants.js';
import { splitAutoJoin } from '../irc/auto_join.js';
import { applyHistory, loadHistory, persistHistory } from '../irc/history.js';
import {
	addSystemMessage,
	applyIrcEvent,
	clearChannelUsersOnDisconnect,
	createInitialChatState,
	STATUS_TARGET,
	withStatus,
} from '../irc/state.js';
import { createGatewaySocket, READY_STATE } from '../gateway/socket.js';

const extractJoinTargets = (line) => {
	if (!line || typeof line !== 'string') {
		return [];
	}

	const trimmed = line.trim();
	if (!trimmed) {
		return [];
	}

	const [command, rest = ''] = trimmed.split(/\s+/, 2);
	if (!command || command.toUpperCase() !== 'JOIN') {
		return [];
	}

	const [channelsPart] = rest.split(/\s+/);
	if (!channelsPart) {
		return [];
	}

	return channelsPart
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
};

const MAX_NICK_RETRIES = 6;
const HISTORY_GRACE_MS = 30000;
const HISTORY_SUPPRESSED_COMMANDS = new Set([
	'PRIVMSG',
	'NOTICE',
	'JOIN',
	'PART',
	'QUIT',
	'NICK',
	'MODE',
	'KICK',
	'INVITE',
	'ACCOUNT',
	'CHGHOST',
]);

const shouldSuppressHistory = (event, connectedAt) => {
	if (!event || !connectedAt) {
		return false;
	}

	const tags = event.tags || {};

	if (tags.batch) {
		return true;
	}

	if (typeof tags.time === 'string') {
		const parsed = Date.parse(tags.time);
		if (!Number.isNaN(parsed) && parsed < connectedAt - HISTORY_GRACE_MS) {
			return true;
		}
	}

	return false;
};

const buildNickCandidate = (baseNick, attempt) => {
	if (!baseNick) {
		return '';
	}

	if (attempt <= 3) {
		return `${baseNick}${'_'.repeat(attempt)}`;
	}

	return `${baseNick}${attempt - 3}`;
};

const createNickRetryState = (baseNick, active = true) => ({
	baseNick,
	attempt: 0,
	lastNick: baseNick,
	active,
});

const useConnections = ({ onIrcEvent }) => {
	const [connections, setConnections] = useState({});
	const wsRef = useRef({});
	const pendingJoinsRef = useRef({});
	const nickRetryRef = useRef({});
	const historySaveRef = useRef({});
	const historyPendingRef = useRef({});
	const connectedAtRef = useRef({});
	const onIrcEventRef = useRef(onIrcEvent);
	useEffect(() => {
		onIrcEventRef.current = onIrcEvent;
	}, [onIrcEvent]);
	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}

		const handleBeforeUnload = () => {
			Object.values(wsRef.current).forEach((socket) => {
				if (socket && typeof socket.close === 'function') {
					socket.close();
				}
			});
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, []);

	const scheduleHistorySave = (connectionId, host, chatState) => {
		if (!connectionId || !chatState) {
			return;
		}

		historyPendingRef.current[connectionId] = { host, chatState };

		if (historySaveRef.current[connectionId]) {
			return;
		}

		historySaveRef.current[connectionId] = setTimeout(() => {
			historySaveRef.current[connectionId] = null;
			const pending = historyPendingRef.current[connectionId];
			if (pending) {
				persistHistory(connectionId, pending.host, pending.chatState);
			}
		}, 250);
	};
	const flushHistorySave = (connectionId) => {
		if (!connectionId) {
			return;
		}

		// Clear any pending timeout
		if (historySaveRef.current[connectionId]) {
			clearTimeout(historySaveRef.current[connectionId]);
			historySaveRef.current[connectionId] = null;
		}

		// Immediately persist if there's pending data
		const pending = historyPendingRef.current[connectionId];
		if (pending) {
			persistHistory(connectionId, pending.host, pending.chatState);
			delete historyPendingRef.current[connectionId];
		}
	};
	const updateChatState = (connectionId, updater) => {
		setConnections((prev) => {
			const connection = prev[connectionId];
			if (!connection) {
				return prev;
			}
			const nextChatState = updater(connection.chatState);
			if (nextChatState === connection.chatState) {
				return prev;
			}
			scheduleHistorySave(
				connectionId,
				connection.settings?.host || '',
				nextChatState
			);
			return {
				...prev,
				[connectionId]: {
					...connection,
					chatState: nextChatState,
				},
			};
		});
	};

	const addStatusNote = (connectionId, text) => {
		updateChatState(connectionId, (prev) =>
			addSystemMessage(prev, STATUS_TARGET, text)
		);
	};

	const sendMessage = (connectionId, payload) => {
		const ws = wsRef.current[connectionId];
		if (!ws || ws.readyState !== READY_STATE.OPEN) {
			updateChatState(connectionId, (prev) =>
				withStatus(prev, 'error', 'Gateway is not open')
			);
			return;
		}
		if (payload?.type === 'irc_send') {
			const joinTargets = extractJoinTargets(payload.line);
			if (joinTargets.length) {
				const pending =
					pendingJoinsRef.current[connectionId] || new Set();
				joinTargets.forEach((channel) => pending.add(channel));
				pendingJoinsRef.current[connectionId] = pending;
			}
		}
		ws.send(payload);
	};

	const connect = ({
		connectionId,
		profileId,
		profileName,
		settings,
		clientCert,
		clientKey,
	}) => {
		if (typeof window === 'undefined' || !window.pulsoGateway) {
			const chatState = withStatus(
				createInitialChatState(settings.nick),
				'error',
				'Desktop runtime not available'
			);
			setConnections((prev) => ({
				...prev,
				[connectionId]: {
					id: connectionId,
					profileId,
					profileName,
					settings,
					chatState,
				},
			}));
			return;
		}

		const existing = wsRef.current[connectionId];
		if (
			existing &&
			(existing.readyState === READY_STATE.OPEN ||
				existing.readyState === READY_STATE.CONNECTING)
		) {
			return;
		}

		if (existing) {
			existing.close();
			wsRef.current[connectionId] = null;
		}

		const baseState = withStatus(
			createInitialChatState(settings.nick),
			'connecting',
			''
		);
		connectedAtRef.current[connectionId] = Date.now();
		const history = loadHistory(connectionId, settings.host);
		const initial = applyHistory(baseState, history);
		pendingJoinsRef.current[connectionId] = new Set();
		nickRetryRef.current[connectionId] = createNickRetryState(
			settings.nick,
			true
		);
		setConnections((prev) => ({
			...prev,
			[connectionId]: {
				id: connectionId,
				profileId,
				profileName,
				settings,
				chatState: initial,
			},
		}));

		const ws = createGatewaySocket();
		wsRef.current[connectionId] = ws;
		addStatusNote(connectionId, 'Connecting to local gateway.');

		ws.addEventListener('message', (event) => {
			let message;

			try {
				message = JSON.parse(event.data);
			} catch {
				addStatusNote(
					connectionId,
					'Received invalid JSON from gateway.'
				);
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
					`Connected to IRC server ${
						message.server || settings.host
					}.`
				);
				if (currentNick) {
					nickRetryRef.current[connectionId] = createNickRetryState(
						currentNick,
						false
					);
				}

				const channels = splitAutoJoin(settings.autoJoin);
				channels.forEach((channel) => {
					sendMessage(connectionId, {
						type: 'irc_send',
						connId: settings.connId,
						line: `JOIN ${channel}`,
					});
				});
			}

			if (message.type === 'disconnected') {
				updateChatState(connectionId, (prev) => {
					// Clear channel user lists to prevent showing stale data
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
					withStatus(
						prev,
						'error',
						message.message || 'Gateway error'
					)
				);
				addStatusNote(
					connectionId,
					`Gateway error: ${
						message.message || message.code || 'unknown'
					}`
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
						nickRetryRef.current[connectionId] =
							createNickRetryState(confirmedNick, false);
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
						const wasRequested =
							channel && pending && pending.has(channel);
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

				updateChatState(connectionId, (prev) =>
					applyIrcEvent(prev, message)
				);
			}
		});

		ws.addEventListener('close', () => {
			updateChatState(connectionId, (prev) => {
				// Clear channel user lists to prevent showing stale data
				const clearedState = clearChannelUsersOnDisconnect(prev);
				return withStatus(clearedState, 'closed', prev.error);
			});
			addStatusNote(connectionId, 'Gateway connection closed.');
			delete pendingJoinsRef.current[connectionId];
			delete nickRetryRef.current[connectionId];
			delete historyPendingRef.current[connectionId];
			delete connectedAtRef.current[connectionId];
			if (historySaveRef.current[connectionId]) {
				clearTimeout(historySaveRef.current[connectionId]);
				historySaveRef.current[connectionId] = null;
			}
		});

		ws.addEventListener('error', () => {
			updateChatState(connectionId, (prev) =>
				withStatus(prev, 'error', 'Gateway error')
			);
			addStatusNote(connectionId, 'Gateway error.');
		});
	};

	const disconnect = (connectionId) => {
		const connection = connections[connectionId];
		if (!connection) {
			return;
		}
		const ws = wsRef.current[connectionId];
		if (ws && ws.readyState === READY_STATE.OPEN) {
			sendMessage(connectionId, {
				type: 'disconnect',
				connId: connection.settings.connId,
				reason: 'client_request',
			});
		}

		if (ws) {
			ws.close();
			wsRef.current[connectionId] = null;
		}

		delete pendingJoinsRef.current[connectionId];
		delete nickRetryRef.current[connectionId];
		delete historyPendingRef.current[connectionId];
		delete connectedAtRef.current[connectionId];
		if (historySaveRef.current[connectionId]) {
			clearTimeout(historySaveRef.current[connectionId]);
			historySaveRef.current[connectionId] = null;
		}
		setConnections((prev) => {
			if (!prev[connectionId]) {
				return prev;
			}
			const next = { ...prev };
			delete next[connectionId];
			return next;
		});
	};

	return {
		connections,
		connect,
		disconnect,
		sendMessage,
		updateChatState,
		addStatusNote,
		flushHistorySave,
	};
};

export { useConnections };
