import { STATUS_TARGET } from '../constants.js';
import { createId } from '../factories.js';
import { appendMessage } from '../messages.js';
import { findSingleChannelForNick } from './helpers.js';

const handleMessageEvent = (state, event) => {
	if (!event || (event.command !== 'PRIVMSG' && event.command !== 'NOTICE')) {
		return null;
	}

	const { command, prefix, text, target, tags, serverTime } = event;
	const me = state.me;
	const timestamp = serverTime || new Date().toISOString();
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
		Boolean(prefix?.server) || (prefix?.nick && prefix.nick.includes('.'));
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
		targetName && (targetName.startsWith('#') || targetName.startsWith('&'))
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
};

export { handleMessageEvent };
