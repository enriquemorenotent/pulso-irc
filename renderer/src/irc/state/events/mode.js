import { STATUS_TARGET } from '../constants.js';
import { createId } from '../factories.js';
import { appendMessage } from '../messages.js';
import { updateTarget } from '../targets.js';
import { updateUserRole } from '../users.js';
import { isChannelName } from '../utils.js';
import { buildRoleModeText, parseRoleModeChanges } from './helpers.js';

const handleModeEvent = (state, event) => {
	if (!event || event.command !== 'MODE') {
		return null;
	}

	const { prefix, params, target, serverTime } = event;
	const timestamp = serverTime || new Date().toISOString();
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
			text: `${event.command} ${params.join(' ')}`.trim(),
		},
		targetType,
		{ incrementUnread: false }
	);
};

export { handleModeEvent };
