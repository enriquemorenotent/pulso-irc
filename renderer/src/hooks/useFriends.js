import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	createFriend,
	createBlockedUser,
	loadFriends,
	loadBlocklist,
	persistFriends,
	persistBlocklist,
	sortFriends,
	sortBlocklist,
} from '../irc/friends.js';

const useFriends = () => {
	const [friends, setFriends] = useState(() => loadFriends());
	const [blocklist, setBlocklist] = useState(() => loadBlocklist());

	// Persist friends whenever they change
	useEffect(() => {
		persistFriends(friends);
	}, [friends]);

	// Persist blocklist whenever it changes
	useEffect(() => {
		persistBlocklist(blocklist);
	}, [blocklist]);

	// Sorted friends list
	const sortedFriends = useMemo(() => sortFriends(friends), [friends]);

	// Sorted blocklist
	const sortedBlocklist = useMemo(
		() => sortBlocklist(blocklist),
		[blocklist]
	);

	// Friends by nick (lowercase) for quick lookup
	const friendsByNick = useMemo(() => {
		const map = new Map();
		friends.forEach((friend) => {
			map.set(friend.nick.toLowerCase(), friend);
		});
		return map;
	}, [friends]);

	// Blocked users by nick (lowercase) for quick lookup
	const blockedByNick = useMemo(() => {
		const map = new Map();
		blocklist.forEach((user) => {
			map.set(user.nick.toLowerCase(), user);
		});
		return map;
	}, [blocklist]);

	// Check if a nick is a friend
	const isFriend = useCallback(
		(nick) => {
			return friendsByNick.has(nick.toLowerCase());
		},
		[friendsByNick]
	);

	// Check if a nick is blocked
	const isBlocked = useCallback(
		(nick) => {
			return blockedByNick.has(nick.toLowerCase());
		},
		[blockedByNick]
	);

	// Get friend by nick
	const getFriend = useCallback(
		(nick) => {
			return friendsByNick.get(nick.toLowerCase()) || null;
		},
		[friendsByNick]
	);

	// Get blocked user by nick
	const getBlockedUser = useCallback(
		(nick) => {
			return blockedByNick.get(nick.toLowerCase()) || null;
		},
		[blockedByNick]
	);

	// Add a new friend
	const addFriend = useCallback((nick, options = {}) => {
		const newFriend = createFriend(nick, options);
		setFriends((prev) => {
			// Check if already exists
			const existing = prev.find(
				(f) => f.nick.toLowerCase() === nick.toLowerCase()
			);
			if (existing) {
				return prev;
			}
			return [...prev, newFriend];
		});
		return newFriend;
	}, []);

	// Remove a friend
	const removeFriend = useCallback((nickOrId) => {
		setFriends((prev) =>
			prev.filter(
				(f) =>
					f.id !== nickOrId &&
					f.nick.toLowerCase() !== nickOrId.toLowerCase()
			)
		);
	}, []);

	// Update a friend
	const updateFriend = useCallback((nickOrId, updates) => {
		setFriends((prev) =>
			prev.map((f) => {
				if (
					f.id === nickOrId ||
					f.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					return {
						...f,
						...updates,
						// Normalize nick if it's being updated
						nick: updates.nick
							? updates.nick.toLowerCase()
							: f.nick,
						displayNick:
							updates.nick ||
							updates.displayNick ||
							f.displayNick,
					};
				}
				return f;
			})
		);
	}, []);

	// Block a user (separate from friends)
	const blockUser = useCallback((nick, reason = '') => {
		const lowerNick = nick.toLowerCase();
		// Check if already blocked
		setBlocklist((prev) => {
			const existing = prev.find((u) => u.nick === lowerNick);
			if (existing) {
				return prev;
			}
			return [...prev, createBlockedUser(nick, reason)];
		});
	}, []);

	// Unblock a user
	const unblockUser = useCallback((nickOrId) => {
		setBlocklist((prev) =>
			prev.filter(
				(u) =>
					u.id !== nickOrId &&
					u.nick.toLowerCase() !== nickOrId.toLowerCase()
			)
		);
	}, []);

	// Update blocked user (e.g., change reason)
	const updateBlockedUser = useCallback((nickOrId, updates) => {
		setBlocklist((prev) =>
			prev.map((u) => {
				if (
					u.id === nickOrId ||
					u.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					return { ...u, ...updates };
				}
				return u;
			})
		);
	}, []);

	// Update last seen for a nick
	const updateLastSeen = useCallback((nick) => {
		const lowerNick = nick.toLowerCase();
		setFriends((prev) =>
			prev.map((f) => {
				if (f.nick === lowerNick) {
					return { ...f, lastSeen: new Date().toISOString() };
				}
				return f;
			})
		);
	}, []);

	// Add network to a friend
	const addNetwork = useCallback((nickOrId, network) => {
		setFriends((prev) =>
			prev.map((f) => {
				if (
					f.id === nickOrId ||
					f.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					if (f.networks.includes(network)) {
						return f;
					}
					return { ...f, networks: [...f.networks, network] };
				}
				return f;
			})
		);
	}, []);

	// Remove network from a friend
	const removeNetwork = useCallback((nickOrId, network) => {
		setFriends((prev) =>
			prev.map((f) => {
				if (
					f.id === nickOrId ||
					f.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					return {
						...f,
						networks: f.networks.filter((n) => n !== network),
					};
				}
				return f;
			})
		);
	}, []);

	// Import friends from array
	const importFriends = useCallback((friendsData) => {
		setFriends((prev) => {
			const existingNicks = new Set(
				prev.map((f) => f.nick.toLowerCase())
			);
			const newFriends = friendsData
				.filter((f) => !existingNicks.has((f.nick || '').toLowerCase()))
				.map((f) => createFriend(f.nick || f.displayNick, f));
			return [...prev, ...newFriends];
		});
	}, []);

	// Export friends
	const exportFriends = useCallback(() => {
		return [...friends];
	}, [friends]);

	return {
		friends: sortedFriends,
		blocklist: sortedBlocklist,
		isFriend,
		isBlocked,
		getFriend,
		getBlockedUser,
		addFriend,
		removeFriend,
		updateFriend,
		blockUser,
		unblockUser,
		updateBlockedUser,
		updateLastSeen,
		addNetwork,
		removeNetwork,
		importFriends,
		exportFriends,
	};
};

export { useFriends };
