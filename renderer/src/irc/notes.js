const NOTES_KEY = 'pulso_user_notes_v1';

const canUseStorage = () =>
	typeof window !== 'undefined' && Boolean(window.localStorage);

const loadNotesStore = () => {
	if (!canUseStorage()) {
		return {};
	}

	try {
		const raw = window.localStorage.getItem(NOTES_KEY);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
};

const persistNotesStore = (store) => {
	if (!canUseStorage()) {
		return;
	}

	try {
		window.localStorage.setItem(NOTES_KEY, JSON.stringify(store || {}));
	} catch {
		// Ignore storage failures (quota, blocked, etc.)
	}
};

const normalizeNick = (nick) => (nick || '').toLowerCase();

const getNote = (store, connectionId, nick) => {
	if (!store || !connectionId || !nick) {
		return '';
	}
	const normalized = normalizeNick(nick);
	return store[connectionId]?.[normalized] || '';
};

const setNote = (store, connectionId, nick, note) => {
	if (!connectionId || !nick) {
		return store;
	}

	const normalized = normalizeNick(nick);
	const trimmed = (note || '').trim();
	const nextStore = { ...(store || {}) };
	const existing = { ...(nextStore[connectionId] || {}) };

	if (!trimmed) {
		delete existing[normalized];
	} else {
		existing[normalized] = trimmed;
	}

	if (Object.keys(existing).length) {
		nextStore[connectionId] = existing;
	} else {
		delete nextStore[connectionId];
	}

	return nextStore;
};

export { getNote, loadNotesStore, persistNotesStore, setNote };
