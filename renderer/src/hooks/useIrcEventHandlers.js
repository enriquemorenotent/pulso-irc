import { useCallback } from 'react';

const WHOIS_NUMERICS = new Set([
	'301',
	'307',
	'311',
	'312',
	'313',
	'317',
	'318',
	'319',
	'330',
	'338',
	'378',
	'401',
	'671',
]);

const createWhoisState = (nick, connectionId) => ({
	nick,
	connectionId,
	status: 'loading',
	error: '',
	data: {
		nick,
		user: '',
		host: '',
		realname: '',
		server: '',
		serverInfo: '',
		account: '',
		idleSeconds: null,
		signonTime: null,
		channels: [],
		away: '',
		operator: false,
		secure: false,
		registered: false,
		extra: [],
	},
});

const useIrcEventHandlers = ({
	getFriend,
	updateFriend,
	getBlockedUser,
	updateBlockedUser,
	getUserNote,
	setUserNote,
	setWhoisState,
}) => {
	const handleIrcEvent = useCallback(
		(connectionId, event) => {
			if (!event) {
				return;
			}

			if (event.command === 'NICK') {
				const oldNick = event.prefix?.nick || event.prefix?.server || '';
				const newNick = event.params?.[0] || '';
				if (oldNick && newNick) {
					const friend = getFriend(oldNick);
					if (friend) {
						updateFriend(friend.id, { nick: newNick });
					}
					const blocked = getBlockedUser(oldNick);
					if (blocked) {
						updateBlockedUser(blocked.id, {
							nick: newNick.toLowerCase(),
							displayNick: newNick,
						});
					}
					const oldKey = oldNick.toLowerCase();
					const newKey = newNick.toLowerCase();
					if (oldKey !== newKey && connectionId) {
						const note = getUserNote(connectionId, oldNick);
						if (note) {
							setUserNote(connectionId, newNick, note);
							setUserNote(connectionId, oldNick, '');
						}
					}
				}
			}

			if (!WHOIS_NUMERICS.has(event.command)) {
				return;
			}

			setWhoisState((prev) => {
				if (!prev || prev.connectionId !== connectionId) {
					return prev;
				}

				const params = Array.isArray(event.params) ? event.params : [];
				const targetNick = params[1] || prev.nick || '';
				if (
					targetNick &&
					prev.nick &&
					targetNick.toLowerCase() !== prev.nick.toLowerCase()
				) {
					return prev;
				}

				const data = { ...prev.data };
				const extra = Array.isArray(data.extra) ? [...data.extra] : [];
				let status = prev.status;
				let error = prev.error;

				switch (event.command) {
					case '301':
						data.away = params[2] || event.text || data.away;
						break;
					case '307':
						data.registered = true;
						break;
					case '311':
						data.nick = params[1] || data.nick;
						data.user = params[2] || data.user;
						data.host = params[3] || data.host;
						data.realname = params[5] || event.text || data.realname;
						break;
					case '312':
						data.server = params[2] || data.server;
						data.serverInfo =
							params[3] || event.text || data.serverInfo;
						break;
					case '313':
						data.operator = true;
						break;
					case '317': {
						const idleSeconds = Number.parseInt(params[2], 10);
						const signonTime = Number.parseInt(params[3], 10);
						if (!Number.isNaN(idleSeconds)) {
							data.idleSeconds = idleSeconds;
						}
						if (!Number.isNaN(signonTime)) {
							data.signonTime = signonTime;
						}
						break;
					}
					case '319': {
						const channelText = params[2] || event.text || '';
						data.channels = channelText.split(' ').filter(Boolean);
						break;
					}
					case '330':
						data.account = params[2] || data.account;
						break;
					case '338':
						if (params[2]) {
							extra.push(`Actual host: ${params[2]}`);
						}
						break;
					case '378':
						if (params[2]) {
							extra.push(params[2]);
						} else if (event.text) {
							extra.push(event.text);
						}
						break;
					case '671':
						data.secure = true;
						break;
					case '401':
						status = 'error';
						error = params[2] || event.text || 'No such nick.';
						break;
					case '318':
						if (status !== 'error') {
							const hasCoreData =
								data.user ||
								data.host ||
								data.realname ||
								data.server ||
								data.account ||
								(Array.isArray(data.channels) &&
									data.channels.length > 0);
							if (!hasCoreData) {
								status = 'error';
								error = `${prev.nick} is not online.`;
							} else {
								status = 'complete';
							}
						}
						break;
					default:
						break;
				}

				data.extra = extra;

				return {
					...prev,
					status,
					error,
					data,
				};
			});
		},
		[
			getBlockedUser,
			getFriend,
			getUserNote,
			setUserNote,
			setWhoisState,
			updateBlockedUser,
			updateFriend,
		]
	);

	return { handleIrcEvent, createWhoisState };
};

export { useIrcEventHandlers, createWhoisState };
