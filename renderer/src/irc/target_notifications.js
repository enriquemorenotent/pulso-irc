const TARGET_NOTIFY_KEY = 'pulso_target_notify_v1';

const normalizeKey = (value) =>
	typeof value === 'string' ? value.trim().toLowerCase() : '';

const loadTargetNotifications = () => {
	if (typeof window === 'undefined') {
		return {};
	}

	try {
		const raw = window.localStorage.getItem(TARGET_NOTIFY_KEY);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
};

const persistTargetNotifications = (store) => {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		window.localStorage.setItem(
			TARGET_NOTIFY_KEY,
			JSON.stringify(store || {})
		);
	} catch {
		// Ignore storage errors
	}
};

const isTargetNotified = (store, connectionId, targetName) => {
	const connKey = normalizeKey(connectionId);
	const targetKey = normalizeKey(targetName);
	if (!connKey || !targetKey) {
		return false;
	}
	return Boolean(store?.[connKey]?.[targetKey]);
};

const setTargetNotified = (store, connectionId, targetName, enabled) => {
	const connKey = normalizeKey(connectionId);
	const targetKey = normalizeKey(targetName);
	if (!connKey || !targetKey) {
		return store;
	}

	const nextStore = { ...(store || {}) };
	const nextConnection = { ...(nextStore[connKey] || {}) };

	if (enabled) {
		nextConnection[targetKey] = true;
	} else {
		delete nextConnection[targetKey];
	}

	if (Object.keys(nextConnection).length === 0) {
		delete nextStore[connKey];
		return nextStore;
	}

	nextStore[connKey] = nextConnection;
	return nextStore;
};

const renameTargetNotified = (store, connectionId, oldName, newName) => {
	const connKey = normalizeKey(connectionId);
	const oldKey = normalizeKey(oldName);
	const newKey = normalizeKey(newName);
	if (!connKey || !oldKey || !newKey || oldKey === newKey) {
		return store;
	}

	const existing = store?.[connKey];
	if (!existing || !existing[oldKey]) {
		return store;
	}

	const nextStore = { ...(store || {}) };
	const nextConnection = { ...existing };
	delete nextConnection[oldKey];
	nextConnection[newKey] = true;
	nextStore[connKey] = nextConnection;

	return nextStore;
};

export {
	loadTargetNotifications,
	persistTargetNotifications,
	isTargetNotified,
	setTargetNotified,
	renameTargetNotified,
};
