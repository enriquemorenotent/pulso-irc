import { handleMessageEvent } from './events/messages.js';
import { handleMembershipEvent } from './events/membership.js';
import { handleNamesEvent } from './events/names.js';
import { handleTopicEvent } from './events/topic.js';
import { handleListEvent } from './events/list.js';
import { handleNumericErrorEvent, handleMotdEvent } from './events/numerics.js';
import { handleModeEvent } from './events/mode.js';
import { handleMiscEvent } from './events/misc.js';

const applyIrcEvent = (state, event) => {
	const handlers = [
		handleMessageEvent,
		handleMembershipEvent,
		handleNamesEvent,
		handleTopicEvent,
		handleListEvent,
		handleNumericErrorEvent,
		handleMotdEvent,
		handleModeEvent,
		handleMiscEvent,
	];

	for (const handler of handlers) {
		const nextState = handler(state, event);
		if (nextState) {
			return nextState;
		}
	}

	return state;
};

export { applyIrcEvent };
