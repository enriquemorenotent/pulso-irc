import { stripIrcFormatting } from '../../formatting.js';
import { updateTarget } from '../targets.js';

const handleTopicEvent = (state, event) => {
	if (!event) {
		return null;
	}

	const { command, params } = event;

	if (command !== '332' && command !== 'TOPIC') {
		return null;
	}

	const channel = command === 'TOPIC' ? params[0] : params[1];
	const topic = command === 'TOPIC' ? params[1] : params[2];

	if (!channel) {
		return state;
	}

	const cleanTopic = typeof topic === 'string' ? stripIrcFormatting(topic) : '';

	return updateTarget(state, channel, (targetData) => ({
		...targetData,
		topic: cleanTopic || targetData.topic,
	}));
};

export { handleTopicEvent };
