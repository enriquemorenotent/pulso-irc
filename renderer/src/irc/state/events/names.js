import { parseNickPrefix, updateUsers } from '../users.js';
import { updateTarget } from '../targets.js';

const handleNamesEvent = (state, event) => {
	if (!event) {
		return null;
	}

	const { command, params } = event;

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
		const channel = params[1];

		if (!channel || !state.targets[channel]) {
			return state;
		}

		return updateTarget(state, channel, (targetData) => ({
			...targetData,
			namesReceived: true,
		}));
	}

	return null;
};

export { handleNamesEvent };
