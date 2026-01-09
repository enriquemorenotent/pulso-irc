import { STATUS_TARGET } from '../constants.js';
import { createId, createListState } from '../factories.js';
import { addSystemMessage, appendMessage } from '../messages.js';

const MOTD_NUMERICS = new Set([
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
]);

const handleNumericErrorEvent = (state, event) => {
	if (!event) {
		return null;
	}

	const { command, params, text, serverTime } = event;
	const timestamp = serverTime || new Date().toISOString();

	if (!/^[45]\d{2}$/.test(command)) {
		return null;
	}

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

	if (targetName && (state.active === targetName || state.targets[targetName])) {
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
};

const handleMotdEvent = (state, event) => {
	if (!event) {
		return null;
	}

	const { command, params } = event;

	if (!MOTD_NUMERICS.has(command)) {
		return null;
	}

	const textParts = params.slice(1).filter(Boolean);
	const messageText = textParts.join(' ');
	if (!messageText) {
		return state;
	}

	return addSystemMessage(state, STATUS_TARGET, messageText);
};

export { handleNumericErrorEvent, handleMotdEvent };
