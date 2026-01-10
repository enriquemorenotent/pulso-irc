import { ROLE_ORDER } from '../roles.js';
import { PREFIX_ORDER } from './constants.js';

const normalizeRolePrefix = (prefix) => {
	if (!prefix) {
		return '';
	}

	const symbols = prefix.split('');
	const ordered = ROLE_ORDER.filter((symbol) => symbols.includes(symbol));
	const extras = symbols.filter((symbol) => !ROLE_ORDER.includes(symbol));
	return [...ordered, ...extras].join('');
};

const applyRoleToPrefix = (prefix, symbol, action) => {
	if (!symbol || !action) {
		return prefix || '';
	}

	const current = prefix || '';

	if (action === 'add') {
		if (current.includes(symbol)) {
			return current;
		}
		return normalizeRolePrefix(`${current}${symbol}`);
	}

	if (action === 'remove') {
		if (!current.includes(symbol)) {
			return current;
		}
		return normalizeRolePrefix(current.split(symbol).join(''));
	}

	return current;
};

const parseNickPrefix = (raw) => {
	if (!raw) {
		return { nick: '', prefix: '' };
	}

	let prefix = '';
	let nick = raw;

	while (PREFIX_ORDER.includes(nick[0]) && nick[0] !== '') {
		prefix += nick[0];
		nick = nick.slice(1);
	}

	return { nick, prefix };
};

const buildUserKeyMap = (users) => {
	const map = new Map();
	Object.keys(users).forEach((key) => {
		map.set(key.toLowerCase(), key);
	});
	return map;
};

const getUserKey = (users, nick, keyMap = null) => {
	if (!nick) {
		return null;
	}
	const lowerNick = nick.toLowerCase();
	if (keyMap) {
		return keyMap.get(lowerNick) || null;
	}
	const match = Object.keys(users).find(
		(key) => key.toLowerCase() === lowerNick
	);
	return match || null;
};

const updateUsers = (target, updates) => {
	const nextUsers = { ...target.users };
	const keyMap = buildUserKeyMap(nextUsers);

	updates.forEach(({ nick, prefix }) => {
		const existingKey = getUserKey(nextUsers, nick, keyMap);
		if (existingKey && existingKey !== nick) {
			delete nextUsers[existingKey];
		}
		nextUsers[nick] = prefix;
		keyMap.set(nick.toLowerCase(), nick);
	});

	return { ...target, users: nextUsers };
};

const updateUserRole = (target, nick, symbol, action) => {
	if (!nick) {
		return target;
	}

	const key = getUserKey(target.users, nick);
	if (!key) {
		return target;
	}

	const current = target.users[key] || '';
	const nextPrefix = applyRoleToPrefix(current, symbol, action);

	if (nextPrefix === current) {
		return target;
	}

	return {
		...target,
		users: {
			...target.users,
			[key]: nextPrefix,
		},
	};
};

const removeUser = (target, nick) => {
	const key = getUserKey(target.users, nick);
	if (!key) {
		return target;
	}

	const nextUsers = { ...target.users };
	delete nextUsers[key];

	return { ...target, users: nextUsers };
};

const renameUser = (target, oldNick, newNick) => {
	const oldKey = getUserKey(target.users, oldNick);
	if (!oldKey) {
		return target;
	}

	const nextUsers = { ...target.users };
	const prefix = nextUsers[oldKey];
	delete nextUsers[oldKey];
	const existingKey = getUserKey(nextUsers, newNick);
	if (existingKey && existingKey !== newNick) {
		delete nextUsers[existingKey];
	}
	nextUsers[newNick] = prefix;

	return { ...target, users: nextUsers };
};

const sortedUsersCache = new WeakMap();

const sortUsers = (users) => {
	if (!users || typeof users !== 'object') {
		return [];
	}

	const cached = sortedUsersCache.get(users);
	if (cached) {
		return cached;
	}

	const entries = Object.entries(users);
	entries.sort((a, b) => {
		const weightA = PREFIX_ORDER.indexOf(a[1]?.[0] || '');
		const weightB = PREFIX_ORDER.indexOf(b[1]?.[0] || '');

		if (weightA !== weightB) {
			return weightA - weightB;
		}

		return a[0].localeCompare(b[0]);
	});

	sortedUsersCache.set(users, entries);
	return entries;
};

export {
	parseNickPrefix,
	getUserKey,
	updateUsers,
	updateUserRole,
	removeUser,
	renameUser,
	sortUsers,
};
