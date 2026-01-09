import { STATUS_TARGET } from './constants.js';

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

export { createId, createTarget, createListState, createInitialChatState };
