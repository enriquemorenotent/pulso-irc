const FRIENDS_KEY = 'pulso_friends_v1';
const BLOCKLIST_KEY = 'pulso_blocklist_v1';

const createId = () => {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * Friend object structure:
 * {
 *   id: string,
 *   nick: string,
 *   alias: string (optional display name),
 *   notes: string (optional notes about this friend),
 *   networks: string[] (network identifiers where this friend is known),
 *   addedAt: string (ISO timestamp),
 *   lastSeen: string | null (ISO timestamp of last activity),
 * }
 */

const createFriend = (nick, overrides = {}) => ({
	id: createId(),
	nick: nick.toLowerCase(),
	displayNick: nick,
	alias: overrides.alias || '',
	notes: overrides.notes || '',
	networks: overrides.networks || [],
	addedAt: new Date().toISOString(),
	lastSeen: overrides.lastSeen || null,
});

/**
 * Blocked user object structure:
 * {
 *   id: string,
 *   nick: string,
 *   displayNick: string,
 *   reason: string (optional reason for blocking),
 *   blockedAt: string (ISO timestamp),
 * }
 */

const createBlockedUser = (nick, reason = '') => ({
	id: createId(),
	nick: nick.toLowerCase(),
	displayNick: nick,
	reason,
	blockedAt: new Date().toISOString(),
});

const loadFriends = () => {
	if (typeof window === 'undefined') {
		return [];
	}

	try {
		const stored = window.localStorage.getItem(FRIENDS_KEY);
		if (!stored) {
			return [];
		}

		const parsed = JSON.parse(stored);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.map((friend) => ({
			id: friend.id || createId(),
			nick: (friend.nick || '').toLowerCase(),
			displayNick: friend.displayNick || friend.nick || '',
			alias: friend.alias || '',
			notes: friend.notes || '',
			networks: Array.isArray(friend.networks) ? friend.networks : [],
			addedAt: friend.addedAt || new Date().toISOString(),
			lastSeen: friend.lastSeen || null,
		}));
	} catch {
		return [];
	}
};

const loadBlocklist = () => {
	if (typeof window === 'undefined') {
		return [];
	}

	try {
		const stored = window.localStorage.getItem(BLOCKLIST_KEY);
		if (!stored) {
			return [];
		}

		const parsed = JSON.parse(stored);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.map((user) => ({
			id: user.id || createId(),
			nick: (user.nick || '').toLowerCase(),
			displayNick: user.displayNick || user.nick || '',
			reason: user.reason || '',
			blockedAt: user.blockedAt || new Date().toISOString(),
		}));
	} catch {
		return [];
	}
};

const persistFriends = (friends) => {
	if (typeof window === 'undefined') {
		return;
	}

	const safeFriends = friends.map((friend) => ({
		id: friend.id,
		nick: friend.nick,
		displayNick: friend.displayNick,
		alias: friend.alias,
		notes: friend.notes,
		networks: friend.networks,
		addedAt: friend.addedAt,
		lastSeen: friend.lastSeen,
	}));

	window.localStorage.setItem(FRIENDS_KEY, JSON.stringify(safeFriends));
};

const persistBlocklist = (blocklist) => {
	if (typeof window === 'undefined') {
		return;
	}

	const safeBlocklist = blocklist.map((user) => ({
		id: user.id,
		nick: user.nick,
		displayNick: user.displayNick,
		reason: user.reason,
		blockedAt: user.blockedAt,
	}));

	window.localStorage.setItem(BLOCKLIST_KEY, JSON.stringify(safeBlocklist));
};

const sortFriends = (friends) => {
	return [...friends].sort((a, b) => {
		const nameA = (a.alias || a.displayNick || a.nick).toLowerCase();
		const nameB = (b.alias || b.displayNick || b.nick).toLowerCase();
		return nameA.localeCompare(nameB);
	});
};

const sortBlocklist = (blocklist) => {
	return [...blocklist].sort((a, b) => {
		const nameA = (a.displayNick || a.nick).toLowerCase();
		const nameB = (b.displayNick || b.nick).toLowerCase();
		return nameA.localeCompare(nameB);
	});
};

export {
	createFriend,
	createBlockedUser,
	loadFriends,
	loadBlocklist,
	persistFriends,
	persistBlocklist,
	sortFriends,
	sortBlocklist,
};
