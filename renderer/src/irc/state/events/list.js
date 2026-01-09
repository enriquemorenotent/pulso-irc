import { stripIrcFormatting } from '../../formatting.js';
import { LIST_MAX_ITEMS } from '../constants.js';
import { createListState } from '../factories.js';

const handleListEvent = (state, event) => {
	if (!event) {
		return null;
	}

	const { command, params, text } = event;

	if (command === '321') {
		return {
			...state,
			list: createListState({ status: 'loading', error: '' }),
		};
	}

	if (command === '322') {
		const channel = params[1];
		if (!channel) {
			return state;
		}

		const users = Number.parseInt(params[2], 10);
		const topic = params[3] || text || '';
		const listState = state.list || createListState();
		const total = listState.total + 1;
		let items = listState.items;
		let truncated = listState.truncated;

		if (!truncated) {
			if (items.length >= LIST_MAX_ITEMS) {
				truncated = true;
			} else {
				items = [
					...items,
					{
						channel,
						users: Number.isNaN(users) ? null : users,
						topic: stripIrcFormatting(topic),
					},
				];
			}
		}

		return {
			...state,
			list: {
				...listState,
				status: listState.status === 'idle' ? 'loading' : listState.status,
				items,
				total,
				truncated,
				error: '',
			},
		};
	}

	if (command === '323') {
		const listState = state.list || createListState();
		return {
			...state,
			list: {
				...listState,
				status: 'complete',
			},
		};
	}

	return null;
};

export { handleListEvent };
