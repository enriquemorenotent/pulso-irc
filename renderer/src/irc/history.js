import { ensureTarget, STATUS_TARGET } from './state.js';
import { isChannelName } from './state/utils.js';

const HISTORY_KEY = 'pulso_history_v1';
const MESSAGE_LIMIT = 300;

const canUseStorage = () =>
	typeof window !== 'undefined' && Boolean(window.localStorage);

const markHistoryMessages = (messages) =>
	messages.map((message) => ({ ...message, isHistory: true }));

const sanitizeMessage = (message) => {
	const sanitized = {
		id: message.id,
		time: message.time,
		type: message.type,
		from: message.from || '',
		text: message.text || '',
		highlight: Boolean(message.highlight),
	};

	if (message.type === 'mode' && message.mode) {
		sanitized.mode = {
			action: message.mode.action || '',
			symbol: message.mode.symbol || '',
			nick: message.mode.nick || '',
			by: message.mode.by || '',
		};
	}

	return sanitized;
};

const buildHistoryEntry = (chatState, host) => {
	const targets = {};
	const order = [];

	chatState.order.forEach((name) => {
		if (name === STATUS_TARGET) {
			return;
		}

		const target = chatState.targets[name];
		if (!target || target.type === 'status') {
			return;
		}

		const messages = Array.isArray(target.messages)
			? target.messages.slice(-MESSAGE_LIMIT).map(sanitizeMessage)
			: [];

		if (!messages.length) {
			return;
		}

		targets[name] = {
			type: target.type === 'dm' ? 'dm' : 'channel',
			messages,
		};
		order.push(name);
	});

	return { host, order, targets };
};

const loadStore = () => {
	if (!canUseStorage()) {
		return {};
	}

	try {
		const raw = window.localStorage.getItem(HISTORY_KEY);
		if (!raw) {
			return {};
		}

		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
};

const saveStore = (store) => {
	if (!canUseStorage()) {
		return;
	}

	try {
		window.localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
	} catch {
		// Ignore storage failures (quota, blocked, etc.)
	}
};

const loadHistory = (connectionId, host) => {
	const store = loadStore();
	const entry = store[connectionId];
	if (!entry || typeof entry !== 'object') {
		return null;
	}

	if (host && entry.host && entry.host !== host) {
		return null;
	}

	return {
		host: entry.host || host || '',
		order: Array.isArray(entry.order) ? entry.order : [],
		targets:
			entry.targets && typeof entry.targets === 'object'
				? entry.targets
				: {},
	};
};

const persistHistory = (connectionId, host, chatState) => {
	if (!connectionId || !chatState) {
		return;
	}

	const entry = buildHistoryEntry(chatState, host);
	const store = loadStore();

	if (!Object.keys(entry.targets).length) {
		delete store[connectionId];
		saveStore(store);
		return;
	}

	store[connectionId] = entry;
	saveStore(store);
};

const clearHistoryTarget = (connectionId, host, targetName) => {
	if (!connectionId || !targetName) {
		return;
	}
	if (targetName === STATUS_TARGET) {
		return;
	}
	const store = loadStore();
	const entry = store[connectionId];
	if (!entry || typeof entry !== 'object') {
		return;
	}
	if (host && entry.host && entry.host !== host) {
		return;
	}
	const nextTargets = { ...(entry.targets || {}) };
	delete nextTargets[targetName];
	const nextOrder = Array.isArray(entry.order)
		? entry.order.filter((name) => name !== targetName)
		: [];
	if (!Object.keys(nextTargets).length) {
		delete store[connectionId];
		saveStore(store);
		return;
	}
	store[connectionId] = {
		...entry,
		targets: nextTargets,
		order: nextOrder,
	};
	saveStore(store);
};

const applyHistory = (state, history, options = {}) => {
	if (!history || !history.targets) {
		return state;
	}

	const includeDms = options.includeDms !== false;
	const targetOrder =
		Array.isArray(history.order) && history.order.length
			? history.order
			: Object.keys(history.targets);

	let nextState = state;

	targetOrder.forEach((name) => {
		const entry = history.targets[name];
		if (
			!entry ||
			!Array.isArray(entry.messages) ||
			!entry.messages.length
		) {
			return;
		}

		const isDm = entry.type === 'dm' || (!entry.type && !isChannelName(name));
		if (!includeDms && isDm) {
			return;
		}
		const type = isDm ? 'dm' : 'channel';
		nextState = ensureTarget(nextState, name, type);

		const messages = markHistoryMessages(
			entry.messages.slice(-MESSAGE_LIMIT)
		);
		const lastReadId = messages[messages.length - 1]?.id || null;
		const target = nextState.targets[name];

		// Note: We intentionally do NOT restore user lists or topics from history
		// as they may be stale. User lists will be populated fresh when we
		// receive NAMES (353/366) from the server after reconnect.
		nextState = {
			...nextState,
			targets: {
				...nextState.targets,
				[name]: {
					...target,
					messages,
					unreadCount: 0,
					lastReadId,
					// Explicitly keep namesReceived: false to indicate users need refresh
					namesReceived: false,
					historyLoaded: true,
				},
			},
		};
	});

	return nextState;
};

const applyHistoryTarget = (state, history, targetName, typeOverride = '') => {
	if (!targetName) {
		return state;
	}

	const entry = history?.targets?.[targetName];
	const inferredIsDm =
		typeOverride === 'dm' ||
		(entry?.type === 'dm' || (!entry?.type && !isChannelName(targetName)));
	const type = typeOverride || (inferredIsDm ? 'dm' : 'channel');

	let nextState = ensureTarget(state, targetName, type);
	const target = nextState.targets[targetName];
	const existingMessages = Array.isArray(target.messages) ? target.messages : [];
	let nextMessages = existingMessages;
	let nextLastReadId = target.lastReadId || null;

	if (entry && Array.isArray(entry.messages) && entry.messages.length) {
		const historyMessages = markHistoryMessages(
			entry.messages.slice(-MESSAGE_LIMIT)
		);
		const historyIds = new Set(historyMessages.map((msg) => msg.id));
		const merged = [
			...historyMessages,
			...existingMessages.filter((msg) => !historyIds.has(msg.id)),
		];
		nextMessages =
			merged.length > MESSAGE_LIMIT
				? merged.slice(-MESSAGE_LIMIT)
				: merged;
		nextLastReadId = historyMessages[historyMessages.length - 1]?.id || null;
	}

	nextState = {
		...nextState,
		targets: {
			...nextState.targets,
			[targetName]: {
				...target,
				messages: nextMessages,
				lastReadId: nextLastReadId,
				historyLoaded: true,
			},
		},
	};

	return nextState;
};

export {
	MESSAGE_LIMIT,
	applyHistory,
	applyHistoryTarget,
	clearHistoryTarget,
	loadHistory,
	persistHistory,
};
