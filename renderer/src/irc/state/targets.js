import { STATUS_TARGET } from './constants.js';
import { createListState, createTarget } from './factories.js';
import { isChannelName } from './utils.js';

const ensureTarget = (state, name, type) => {
	if (state.targets[name]) {
		return state;
	}

	return {
		...state,
		targets: {
			...state.targets,
			[name]: createTarget(name, type),
		},
		order: [...state.order, name],
		active: state.active || name,
	};
};

const markTargetRead = (state, targetName) => {
	if (!targetName) {
		return state;
	}

	const target = state.targets[targetName];
	if (!target) {
		return state;
	}

	const lastMessageId =
		target.messages[target.messages.length - 1]?.id || null;
	const unreadCount =
		typeof target.unreadCount === 'number' ? target.unreadCount : 0;
	const shouldUpdate =
		target.lastReadId !== lastMessageId || unreadCount !== 0;

	if (!shouldUpdate) {
		return state;
	}

	return {
		...state,
		targets: {
			...state.targets,
			[targetName]: {
				...target,
				lastReadId: lastMessageId,
				unreadCount: 0,
			},
		},
	};
};

const setActiveTarget = (state, targetName, type = 'channel') => {
	const withTarget = ensureTarget(state, targetName, type);
	const previousActive = withTarget.active;
	let nextState = withTarget;

	if (previousActive && previousActive !== targetName) {
		nextState = markTargetRead(nextState, previousActive);
	}

	const target = nextState.targets[targetName];

	if (!target) {
		return nextState;
	}

	const unreadCount =
		typeof target.unreadCount === 'number' ? target.unreadCount : 0;

	if (nextState.active === targetName && unreadCount === 0) {
		return nextState;
	}

	return {
		...nextState,
		active: targetName,
		targets: {
			...nextState.targets,
			[targetName]: {
				...target,
				unreadCount: 0,
			},
		},
	};
};

const removeTarget = (state, targetName) => {
	if (!state.targets[targetName] || targetName === STATUS_TARGET) {
		return state;
	}

	const nextTargets = { ...state.targets };
	delete nextTargets[targetName];

	const nextOrder = state.order.filter((name) => name !== targetName);
	const nextActive =
		state.active === targetName
			? nextOrder[0] || STATUS_TARGET
			: state.active;

	return {
		...state,
		targets: nextTargets,
		order: nextOrder,
		active: nextActive,
	};
};

const renameTarget = (state, oldName, newName) => {
	if (!oldName || !newName) {
		return state;
	}
	if (oldName === newName || newName === STATUS_TARGET) {
		return state;
	}

	const target = state.targets[oldName];
	if (!target || target.type !== 'dm') {
		return state;
	}
	if (isChannelName(newName) || state.targets[newName]) {
		return state;
	}

	const nextTargets = { ...state.targets };
	delete nextTargets[oldName];
	nextTargets[newName] = { ...target, name: newName };

	return {
		...state,
		targets: nextTargets,
		order: state.order.map((name) => (name === oldName ? newName : name)),
		active: state.active === oldName ? newName : state.active,
	};
};

const clearTargetMessages = (state, targetName) => {
	if (!state.targets[targetName] || targetName === STATUS_TARGET) {
		return state;
	}

	const target = state.targets[targetName];
	const shouldReset =
		target.messages.length ||
		target.unreadCount !== 0 ||
		target.lastReadId !== null;

	if (!shouldReset) {
		return state;
	}

	return {
		...state,
		targets: {
			...state.targets,
			[targetName]: {
				...target,
				messages: [],
				unreadCount: 0,
				lastReadId: null,
			},
		},
	};
};

const updateTarget = (state, targetName, updater, type = 'channel') => {
	const withTarget = ensureTarget(state, targetName, type);
	const target = withTarget.targets[targetName];
	const nextTarget = updater(target);

	if (nextTarget === target) {
		return withTarget;
	}

	return {
		...withTarget,
		targets: {
			...withTarget.targets,
			[targetName]: nextTarget,
		},
	};
};

const clearChannelUsersOnDisconnect = (state) => {
	// Clear all channel user lists to prevent stale data after disconnect
	const nextTargets = {};

	Object.entries(state.targets).forEach(([name, target]) => {
		if (target.type === 'channel') {
			nextTargets[name] = {
				...target,
				users: {},
				namesReceived: false,
				topic: '',
			};
		} else {
			nextTargets[name] = target;
		}
	});

	return {
		...state,
		targets: nextTargets,
		list: createListState(),
	};
};

export {
	ensureTarget,
	markTargetRead,
	setActiveTarget,
	removeTarget,
	renameTarget,
	clearTargetMessages,
	updateTarget,
	clearChannelUsersOnDisconnect,
};
