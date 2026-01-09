import { STATUS_TARGET } from '../constants.js';
import { createId } from '../factories.js';
import { appendMessage } from '../messages.js';
import { isChannelName } from '../utils.js';

const MISC_COMMANDS = new Set(['KICK', 'INVITE', 'ACCOUNT', 'CHGHOST']);

const handleMiscEvent = (state, event) => {
	if (!event || !MISC_COMMANDS.has(event.command)) {
		return null;
	}

	const { command, params, target, serverTime } = event;
	const timestamp = serverTime || new Date().toISOString();
	const channel = [target, ...params].find((entry) => isChannelName(entry));
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
};

export { handleMiscEvent };
