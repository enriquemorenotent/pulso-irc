import { stripIrcFormatting } from './formatting.js';
import { ROLE_MODE_MAP, ROLE_ORDER, getRoleText } from './roles.js';

const STATUS_TARGET = '*status';
const MAX_MESSAGES = 500;
const LIST_MAX_ITEMS = 2000;
const PREFIX_ORDER = [...ROLE_ORDER, ''];

const createId = () => {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createTarget = (name, type = 'channel') => ({
	name,
	type,
	topic: '',
	users: {},
	messages: [],
	unreadCount: 0,
	lastReadId: null,
	namesReceived: false,
	joined: type !== 'channel',
});

const createListState = (overrides = {}) => ({
	status: 'idle',
	items: [],
	total: 0,
	truncated: false,
	error: '',
	...overrides,
});

const isChannelName = (name) =>
	Boolean(name) && (name.startsWith('#') || name.startsWith('&'));

const normalizeRolePrefix = (prefix) => {
	if (!prefix) {
		return '';
	}

	const symbols = prefix.split('');
	const ordered = ROLE_ORDER.filter((symbol) => symbols.includes(symbol));
	const extras = symbols.filter((symbol) => !ROLE_ORDER.includes(symbol));
	return [...ordered, ...extras].join('');
};

const applyRoleToPrefix = (prefix, symbol, action) => {
	if (!symbol || !action) {
		return prefix || '';
	}

	const current = prefix || '';

	if (action === 'add') {
		if (current.includes(symbol)) {
			return current;
		}
		return normalizeRolePrefix(`${current}${symbol}`);
	}

	if (action === 'remove') {
		if (!current.includes(symbol)) {
			return current;
		}
		return normalizeRolePrefix(current.split(symbol).join(''));
	}

	return current;
};

const ensureTarget = (state, name, type) => {
	if (state.targets[name]) {
		return state;
	}

	return {
		...state,
		targets: {
			...state.targets,
			[name]: createTarget(name, type),
		},
		order: [...state.order, name],
		active: state.active || name,
	};
};

const markTargetRead = (state, targetName) => {
	if (!targetName) {
		return state;
	}

	const target = state.targets[targetName];
	if (!target) {
		return state;
	}

	const lastMessageId =
		target.messages[target.messages.length - 1]?.id || null;
	const unreadCount =
		typeof target.unreadCount === 'number' ? target.unreadCount : 0;
	const shouldUpdate =
		target.lastReadId !== lastMessageId || unreadCount !== 0;

	if (!shouldUpdate) {
		return state;
	}

	return {
		...state,
		targets: {
			...state.targets,
			[targetName]: {
				...target,
				lastReadId: lastMessageId,
				unreadCount: 0,
			},
		},
	};
};

const setActiveTarget = (state, targetName, type = 'channel') => {
	const withTarget = ensureTarget(state, targetName, type);
	const previousActive = withTarget.active;
	let nextState = withTarget;

	if (previousActive && previousActive !== targetName) {
		nextState = markTargetRead(nextState, previousActive);
	}

	const target = nextState.targets[targetName];

	if (!target) {
		return nextState;
	}

	const unreadCount =
		typeof target.unreadCount === 'number' ? target.unreadCount : 0;

	if (nextState.active === targetName && unreadCount === 0) {
		return nextState;
	}

	return {
		...nextState,
		active: targetName,
		targets: {
			...nextState.targets,
			[targetName]: {
				...target,
				unreadCount: 0,
			},
		},
	};
};

const removeTarget = (state, targetName) => {
	if (!state.targets[targetName] || targetName === STATUS_TARGET) {
		return state;
	}

	const nextTargets = { ...state.targets };
	delete nextTargets[targetName];

	const nextOrder = state.order.filter((name) => name !== targetName);
	const nextActive =
		state.active === targetName
			? nextOrder[0] || STATUS_TARGET
			: state.active;

	return {
		...state,
		targets: nextTargets,
		order: nextOrder,
		active: nextActive,
	};
};

const renameTarget = (state, oldName, newName) => {
	if (!oldName || !newName) {
		return state;
	}
	if (oldName === newName || newName === STATUS_TARGET) {
		return state;
	}

	const target = state.targets[oldName];
	if (!target || target.type !== 'dm') {
		return state;
	}
	if (isChannelName(newName) || state.targets[newName]) {
		return state;
	}

	const nextTargets = { ...state.targets };
	delete nextTargets[oldName];
	nextTargets[newName] = { ...target, name: newName };

	return {
		...state,
		targets: nextTargets,
		order: state.order.map((name) => (name === oldName ? newName : name)),
		active: state.active === oldName ? newName : state.active,
	};
};

const clearTargetMessages = (state, targetName) => {
	if (!state.targets[targetName] || targetName === STATUS_TARGET) {
		return state;
	}

	const target = state.targets[targetName];
	const shouldReset =
		target.messages.length ||
		target.unreadCount !== 0 ||
		target.lastReadId !== null;

	if (!shouldReset) {
		return state;
	}

	return {
		...state,
		targets: {
			...state.targets,
			[targetName]: {
				...target,
				messages: [],
				unreadCount: 0,
				lastReadId: null,
			},
		},
	};
};

const appendMessage = (
	state,
	targetName,
	message,
	type = 'channel',
	{ incrementUnread = true } = {}
) => {
	const withTarget = ensureTarget(state, targetName, type);
	const target = withTarget.targets[targetName];

	const messages = [...target.messages, message];
	const clipped =
		messages.length > MAX_MESSAGES
			? messages.slice(-MAX_MESSAGES)
			: messages;
	const unreadCount =
		typeof target.unreadCount === 'number' ? target.unreadCount : 0;
	const shouldIncrement =
		incrementUnread &&
		targetName !== STATUS_TARGET &&
		withTarget.active !== targetName;
	const nextUnread = shouldIncrement ? unreadCount + 1 : unreadCount;

	return {
		...withTarget,
		targets: {
			...withTarget.targets,
			[targetName]: {
				...target,
				messages: clipped,
				unreadCount: nextUnread,
			},
		},
	};
};

const addSystemMessage = (state, targetName, text, meta = {}) => {
	const message = {
		id: createId(),
		time: new Date().toISOString(),
		type: 'system',
		text,
		...meta,
	};

	return appendMessage(
		state,
		targetName,
		message,
		targetName === STATUS_TARGET ? 'status' : 'channel'
	);
};

const buildRoleModeText = ({ action, symbol, nick }) => {
	const actionText = action === 'add' ? 'gained' : 'lost';
	const roleText = symbol ? getRoleText(symbol) : '';
	return `${nick} ${actionText} ${roleText}`.trim();
};

const parseRoleModeChanges = (modeString, modeParams = []) => {
	if (!modeString || typeof modeString !== 'string') {
		return { ok: false, changes: [] };
	}

	let sign = null;
	let paramIndex = 0;
	const changes = [];

	for (const char of modeString) {
		if (char === '+' || char === '-') {
			sign = char;
			continue;
		}

		const symbol = ROLE_MODE_MAP[char];
		if (!symbol || !sign) {
			return { ok: false, changes: [] };
		}

		const nick = modeParams[paramIndex];
		if (!nick) {
			return { ok: false, changes: [] };
		}

		changes.push({
			action: sign === '+' ? 'add' : 'remove',
			symbol,
			nick,
		});
		paramIndex += 1;
	}

	if (paramIndex !== modeParams.length) {
		return { ok: false, changes: [] };
	}

	return { ok: changes.length > 0, changes };
};

const findSingleChannelForNick = (state, nick) => {
	if (!nick) {
		return null;
	}

	const matches = state.order.filter((name) => {
		const target = state.targets[name];
		return target?.type === 'channel' && target.users?.[nick];
	});

	return matches.length === 1 ? matches[0] : null;
};

const addOutgoingMessage = (
	state,
	targetName,
	text,
	type = 'message',
	meta = {}
) => {
	const targetType =
		targetName && (targetName.startsWith('#') || targetName.startsWith('&'))
			? 'channel'
			: 'dm';
	const message = {
		id: createId(),
		time: new Date().toISOString(),
		type,
		from: meta.from || state.me || '',
		text,
		highlight: false,
		...meta,
	};

	return appendMessage(state, targetName, message, targetType);
};

const parseNickPrefix = (raw) => {
	if (!raw) {
		return { nick: '', prefix: '' };
	}

	let prefix = '';
	let nick = raw;

	while (PREFIX_ORDER.includes(nick[0]) && nick[0] !== '') {
		prefix += nick[0];
		nick = nick.slice(1);
	}

	return { nick, prefix };
};

const buildUserKeyMap = (users) => {
	const map = new Map();
	Object.keys(users).forEach((key) => {
		map.set(key.toLowerCase(), key);
	});
	return map;
};

const getUserKey = (users, nick, keyMap = null) => {
	if (!nick) {
		return null;
	}
	const lowerNick = nick.toLowerCase();
	if (keyMap) {
		return keyMap.get(lowerNick) || null;
	}
	const match = Object.keys(users).find(
		(key) => key.toLowerCase() === lowerNick
	);
	return match || null;
};

const updateUsers = (target, updates) => {
	const nextUsers = { ...target.users };
	const keyMap = buildUserKeyMap(nextUsers);

	updates.forEach(({ nick, prefix }) => {
		const existingKey = getUserKey(nextUsers, nick, keyMap);
		if (existingKey && existingKey !== nick) {
			delete nextUsers[existingKey];
		}
		nextUsers[nick] = prefix;
		keyMap.set(nick.toLowerCase(), nick);
	});

	return { ...target, users: nextUsers };
};

const updateUserRole = (target, nick, symbol, action) => {
	if (!nick) {
		return target;
	}

	const key = getUserKey(target.users, nick);
	if (!key) {
		return target;
	}

	const current = target.users[key] || '';
	const nextPrefix = applyRoleToPrefix(current, symbol, action);

	if (nextPrefix === current) {
		return target;
	}

	return {
		...target,
		users: {
			...target.users,
			[key]: nextPrefix,
		},
	};
};

const removeUser = (target, nick) => {
	const key = getUserKey(target.users, nick);
	if (!key) {
		return target;
	}

	const nextUsers = { ...target.users };
	delete nextUsers[key];

	return { ...target, users: nextUsers };
};

const renameUser = (target, oldNick, newNick) => {
	const oldKey = getUserKey(target.users, oldNick);
	if (!oldKey) {
		return target;
	}

	const nextUsers = { ...target.users };
	const prefix = nextUsers[oldKey];
	delete nextUsers[oldKey];
	const existingKey = getUserKey(nextUsers, newNick);
	if (existingKey && existingKey !== newNick) {
		delete nextUsers[existingKey];
	}
	nextUsers[newNick] = prefix;

	return { ...target, users: nextUsers };
};

const updateTarget = (state, targetName, updater, type = 'channel') => {
	const withTarget = ensureTarget(state, targetName, type);
	const target = withTarget.targets[targetName];
	const nextTarget = updater(target);

	if (nextTarget === target) {
		return withTarget;
	}

	return {
		...withTarget,
		targets: {
			...withTarget.targets,
			[targetName]: nextTarget,
		},
	};
};

const withStatus = (state, status, error = '') => ({
	...state,
	status,
	error,
});

const applyIrcEvent = (state, event) => {
	const { command, prefix, params, text, target, tags, serverTime } = event;
	const me = state.me;
	const timestamp = serverTime || new Date().toISOString();

	if (command === 'PRIVMSG' || command === 'NOTICE') {
		const isAction =
			text && text.startsWith('\u0001ACTION ') && text.endsWith('\u0001');
		const displayText = isAction ? text.slice(8, -1) : text;
		const messageType = isAction
			? 'action'
			: command === 'NOTICE'
			? 'notice'
			: 'message';
		const from = prefix?.nick || prefix?.server || 'server';
		const isService = Boolean(prefix?.nick && /serv$/i.test(prefix.nick));
		const isServer =
			Boolean(prefix?.server) ||
			(prefix?.nick && prefix.nick.includes('.'));
		const isChannelTarget =
			target && (target.startsWith('#') || target.startsWith('&'));
		let treatAsStatus = command === 'NOTICE' || isServer || isService;
		const isSelfTarget =
			me && target && target.toLowerCase() === me.toLowerCase();
		let targetName = isChannelTarget
			? target
			: treatAsStatus
			? STATUS_TARGET
			: isSelfTarget
			? from
			: target || from;

		if (messageType === 'notice' && targetName === STATUS_TARGET && from) {
			const singleChannel = findSingleChannelForNick(state, from);
			if (singleChannel) {
				treatAsStatus = false;
				targetName = singleChannel;
			}
		}
		const highlight =
			me && displayText
				? displayText.toLowerCase().includes(me.toLowerCase())
				: false;

		const targetType =
			targetName &&
			(targetName.startsWith('#') || targetName.startsWith('&'))
				? 'channel'
				: 'dm';
		return appendMessage(
			state,
			targetName,
			{
				id: createId(),
				time: timestamp,
				type: messageType,
				from,
				text: displayText || '',
				highlight,
				tags,
			},
			targetType,
			{ incrementUnread: messageType !== 'notice' }
		);
	}

	if (command === 'JOIN') {
		const channel = target || params[0];
		const nick = prefix?.nick || '';
		const next = appendMessage(
			state,
			channel,
			{
				id: createId(),
				time: timestamp,
				type: 'join',
				text:
					nick === me ? 'You joined' : `${nick} joined`,
			},
			'channel',
			{ incrementUnread: false }
		);

		const updated = updateTarget(next, channel, (targetData) => {
			const updates = nick
				? [{ nick, prefix: targetData.users[nick] || '' }]
				: [];
			return updateUsers({ ...targetData, joined: true }, updates);
		});

		if (nick === me) {
			// Reset namesReceived flag on join to ensure fresh user list
			const withResetFlag = updateTarget(
				updated,
				channel,
				(targetData) => ({
					...targetData,
					namesReceived: false,
				})
			);
			return setActiveTarget(withResetFlag, channel, 'channel');
		}

		return updated;
	}

	if (command === 'PART') {
		const channel = target || params[0];
		const nick = prefix?.nick || '';
		if (nick === me && channel) {
			const withoutChannel = removeTarget(state, channel);
			return addSystemMessage(
				withoutChannel,
				STATUS_TARGET,
				`You left ${channel}`
			);
		}

		const updated = appendMessage(
			state,
			channel,
			{
				id: createId(),
				time: timestamp,
				type: 'part',
				text: `${nick} left`,
			},
			'channel',
			{ incrementUnread: false }
		);

		return updateTarget(updated, channel, (targetData) =>
			removeUser(targetData, nick)
		);
	}

	if (command === 'QUIT') {
		const nick = prefix?.nick || '';
		const reason = params[0] || '';
		if (!nick) {
			return state;
		}
		let nextState = state;
		let quitReported = false;

		state.order.forEach((name) => {
			const targetData = nextState.targets[name];
			if (targetData.type !== 'channel') {
				return;
			}
			if (!getUserKey(targetData.users, nick)) {
				return;
			}

			nextState = appendMessage(
				nextState,
				name,
				{
					id: createId(),
					time: timestamp,
					type: 'quit',
					text: `${nick} quit (${reason})`
						.trim()
						.replace(/\(\)$/, ''),
				},
				'channel',
				{ incrementUnread: false }
			);
			quitReported = true;

			nextState = updateTarget(nextState, name, (data) =>
				removeUser(data, nick)
			);
		});

		return quitReported ? nextState : state;
	}

	if (command === 'NICK') {
		const oldNick = prefix?.nick || prefix?.server || '';
		const newNick = params[0] || '';
		if (!oldNick || !newNick || oldNick === newNick) {
			return state;
		}

		const messageText = `${oldNick} is now known as ${newNick}`;
		const isSelfChange =
			me && oldNick.toLowerCase() === me.toLowerCase();
		let nextState = state;
		state.order.forEach((name) => {
			const targetData = nextState.targets[name];
			if (targetData.type !== 'channel') {
				return;
			}
			const hasNick = Boolean(getUserKey(targetData.users, oldNick));
			if (!hasNick && !(isSelfChange && targetData.joined)) {
				return;
			}

			nextState = appendMessage(
				nextState,
				name,
				{
					id: createId(),
					time: timestamp,
					type: 'nick',
					text: messageText,
				},
				'channel',
				{ incrementUnread: false }
			);
			nextState = updateTarget(nextState, name, (data) =>
				renameUser(data, oldNick, newNick)
			);
		});

		nextState = appendMessage(
			nextState,
			STATUS_TARGET,
			{
				id: createId(),
				time: timestamp,
				type: 'nick',
				text: messageText,
			},
			'status',
			{ incrementUnread: false }
		);

		nextState = renameTarget(nextState, oldNick, newNick);

		if (isSelfChange) {
			nextState = {
				...nextState,
				me: newNick,
			};
		}

		return nextState;
	}

	if (command === '353') {
		const channel = params[2];
		const names = params[params.length - 1] || '';

		if (!channel) {
			return state;
		}

		const updates = names
			.split(' ')
			.filter(Boolean)
			.map((raw) => parseNickPrefix(raw));

		return updateTarget(state, channel, (targetData) => {
			// Clear users on first NAMES reply to remove stale data
			if (!targetData.namesReceived) {
				return {
					...updateUsers({ ...targetData, users: {} }, updates),
					namesReceived: true,
				};
			}
			return updateUsers(targetData, updates);
		});
	}

	if (command === '366') {
		// End of NAMES list - mark as complete
		const channel = params[1];

		if (!channel || !state.targets[channel]) {
			return state;
		}

		return updateTarget(state, channel, (targetData) => ({
			...targetData,
			namesReceived: true,
		}));
	}

	if (command === '332' || command === 'TOPIC') {
		const channel = command === 'TOPIC' ? params[0] : params[1];
		const topic = command === 'TOPIC' ? params[1] : params[2];

		if (!channel) {
			return state;
		}

		const cleanTopic =
			typeof topic === 'string' ? stripIrcFormatting(topic) : '';

		return updateTarget(state, channel, (targetData) => ({
			...targetData,
			topic: cleanTopic || targetData.topic,
		}));
	}

	if (command === '321') {
		return {
			...state,
			list: createListState({ status: 'loading', error: '' }),
		};
	}

	if (command === '322') {
		const channel = params[1];
		if (!channel) {
			return state;
		}

		const users = Number.parseInt(params[2], 10);
		const topic = params[3] || text || '';
		const listState = state.list || createListState();
		const total = listState.total + 1;
		let items = listState.items;
		let truncated = listState.truncated;

		if (!truncated) {
			if (items.length >= LIST_MAX_ITEMS) {
				truncated = true;
			} else {
				items = [
					...items,
					{
						channel,
						users: Number.isNaN(users) ? null : users,
						topic: stripIrcFormatting(topic),
					},
				];
			}
		}

		return {
			...state,
			list: {
				...listState,
				status: listState.status === 'idle' ? 'loading' : listState.status,
				items,
				total,
				truncated,
				error: '',
			},
		};
	}

	if (command === '323') {
		const listState = state.list || createListState();
		return {
			...state,
			list: {
				...listState,
				status: 'complete',
			},
		};
	}

	if (/^[45]\d{2}$/.test(command)) {
		const textParts = params.slice(1).filter(Boolean);
		const messageText = textParts.join(' ');
		const targetName = params[1] || '';
		const bodyParts = params.slice(2).filter(Boolean);
		const bodyText = bodyParts.join(' ');
		const finalText = messageText || text || '';
		if (!finalText) {
			return state;
		}

		let nextState = addSystemMessage(
			state,
			STATUS_TARGET,
			`[${command}] ${finalText}`
		);

		if (
			targetName &&
			(state.active === targetName || state.targets[targetName])
		) {
			const isChannelTarget =
				targetName.startsWith('#') || targetName.startsWith('&');
			const errorText = bodyText || text || messageText;
			const targetType = isChannelTarget ? 'channel' : 'dm';
			nextState = appendMessage(
				nextState,
				targetName,
				{
					id: createId(),
					time: timestamp,
					type: 'system',
					text: `Send failed [${command}]: ${errorText}`,
				},
				targetType
			);
		}

		const listState = nextState.list || createListState();
		if (listState.status === 'loading') {
			nextState = {
				...nextState,
				list: {
					...listState,
					status: 'error',
					error: finalText || 'Channel list failed.',
				},
			};
		}

		return nextState;
	}

	if (
		[
			'001',
			'002',
			'003',
			'004',
			'005',
			'250',
			'251',
			'252',
			'253',
			'254',
			'255',
			'265',
			'266',
			'375',
			'372',
			'376',
			'422',
		].includes(command)
	) {
		const textParts = params.slice(1).filter(Boolean);
		const messageText = textParts.join(' ');
		if (!messageText) {
			return state;
		}

		return addSystemMessage(state, STATUS_TARGET, messageText);
	}

	if (command === 'MODE') {
		const modeTarget = target || params[0];
		const channel = isChannelName(modeTarget) ? modeTarget : null;

		if (channel) {
			const modeString = params[1] || '';
			const modeParams = params.slice(2);
			const parsed = parseRoleModeChanges(modeString, modeParams);
			if (parsed.ok) {
				const modeBy = prefix?.nick || '';
				let nextState = state;

				parsed.changes.forEach((change) => {
					const text = buildRoleModeText(change);
					nextState = appendMessage(
						nextState,
						channel,
						{
							id: createId(),
							time: timestamp,
							type: 'mode',
							text,
							mode: {
								...change,
								by: modeBy,
							},
						},
						'channel',
						{ incrementUnread: false }
					);

					nextState = updateTarget(nextState, channel, (targetData) =>
						updateUserRole(
							targetData,
							change.nick,
							change.symbol,
							change.action
						)
					);
				});

				return nextState;
			}
		}

		const targetName = channel || STATUS_TARGET;
		const targetType = targetName === STATUS_TARGET ? 'status' : 'channel';
		return appendMessage(
			state,
			targetName,
			{
				id: createId(),
				time: timestamp,
				type: 'system',
				text: `${command} ${params.join(' ')}`.trim(),
			},
			targetType,
			{ incrementUnread: false }
		);
	}

	if (['KICK', 'INVITE', 'ACCOUNT', 'CHGHOST'].includes(command)) {
		const channel = [target, ...params].find((entry) =>
			isChannelName(entry)
		);
		const targetName = channel || STATUS_TARGET;
		const targetType = targetName === STATUS_TARGET ? 'status' : 'channel';
		return appendMessage(
			state,
			targetName,
			{
				id: createId(),
				time: timestamp,
				type: 'system',
				text: `${command} ${params.join(' ')}`.trim(),
			},
			targetType,
			{ incrementUnread: false }
		);
	}

	return state;
};

const createInitialChatState = (nick = '') => ({
	status: 'idle',
	error: '',
	me: nick,
	server: '',
	capEnabled: [],
	list: createListState(),
	targets: {
		[STATUS_TARGET]: createTarget(STATUS_TARGET, 'status'),
	},
	order: [STATUS_TARGET],
	active: STATUS_TARGET,
});

const sortUsers = (users) => {
	const entries = Object.entries(users);

	return entries.sort((a, b) => {
		const weightA = PREFIX_ORDER.indexOf(a[1]?.[0] || '');
		const weightB = PREFIX_ORDER.indexOf(b[1]?.[0] || '');

		if (weightA !== weightB) {
			return weightA - weightB;
		}

		return a[0].localeCompare(b[0]);
	});
};

const clearChannelUsersOnDisconnect = (state) => {
	// Clear all channel user lists to prevent stale data after disconnect
	const nextTargets = {};

	Object.entries(state.targets).forEach(([name, target]) => {
		if (target.type === 'channel') {
			nextTargets[name] = {
				...target,
				users: {},
				namesReceived: false,
				topic: '', // Also clear topic as it may be stale
			};
		} else {
			nextTargets[name] = target;
		}
	});

	return {
		...state,
		targets: nextTargets,
		list: createListState(),
	};
};

export {
	STATUS_TARGET,
	addOutgoingMessage,
	addSystemMessage,
	applyIrcEvent,
	clearChannelUsersOnDisconnect,
	clearTargetMessages,
	createInitialChatState,
	createListState,
	ensureTarget,
	removeTarget,
	markTargetRead,
	setActiveTarget,
	sortUsers,
	withStatus,
};
