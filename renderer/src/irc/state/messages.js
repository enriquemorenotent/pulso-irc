import { MAX_MESSAGES, STATUS_TARGET } from './constants.js';
import { createId } from './factories.js';
import { ensureTarget } from './targets.js';

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

export { appendMessage, addSystemMessage, addOutgoingMessage };
