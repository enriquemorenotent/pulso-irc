import { useCallback } from 'react';
import { createFriend, createBlockedUser } from '../../irc/friends.js';

const useFriendsActions = ({
	friends,
	friendsByNick,
	blockedByNick,
	setFriends,
	setBlocklist,
}) => {
	const isFriend = useCallback(
		(nick) => friendsByNick.has(nick.toLowerCase()),
		[friendsByNick]
	);

	const isBlocked = useCallback(
		(nick) => blockedByNick.has(nick.toLowerCase()),
		[blockedByNick]
	);

	const getFriend = useCallback(
		(nick) => friendsByNick.get(nick.toLowerCase()) || null,
		[friendsByNick]
	);

	const getBlockedUser = useCallback(
		(nick) => blockedByNick.get(nick.toLowerCase()) || null,
		[blockedByNick]
	);

	const addFriend = useCallback((nick, options = {}) => {
		const newFriend = createFriend(nick, options);
		setFriends((prev) => {
			const existing = prev.find(
				(friend) => friend.nick.toLowerCase() === nick.toLowerCase()
			);
			if (existing) {
				return prev;
			}
			return [...prev, newFriend];
		});
		return newFriend;
	}, [setFriends]);

	const removeFriend = useCallback((nickOrId) => {
		setFriends((prev) =>
			prev.filter(
				(friend) =>
					friend.id !== nickOrId &&
					friend.nick.toLowerCase() !== nickOrId.toLowerCase()
			)
		);
	}, [setFriends]);

	const updateFriend = useCallback((nickOrId, updates) => {
		setFriends((prev) =>
			prev.map((friend) => {
				if (
					friend.id === nickOrId ||
					friend.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					return {
						...friend,
						...updates,
						nick: updates.nick
							? updates.nick.toLowerCase()
							: friend.nick,
						displayNick:
							updates.nick ||
							updates.displayNick ||
							friend.displayNick,
					};
				}
				return friend;
			})
		);
	}, [setFriends]);

	const blockUser = useCallback((nick, reason = '') => {
		const lowerNick = nick.toLowerCase();
		setBlocklist((prev) => {
			const existing = prev.find((user) => user.nick === lowerNick);
			if (existing) {
				return prev;
			}
			return [...prev, createBlockedUser(nick, reason)];
		});
	}, [setBlocklist]);

	const unblockUser = useCallback((nickOrId) => {
		setBlocklist((prev) =>
			prev.filter(
				(user) =>
					user.id !== nickOrId &&
					user.nick.toLowerCase() !== nickOrId.toLowerCase()
			)
		);
	}, [setBlocklist]);

	const updateBlockedUser = useCallback((nickOrId, updates) => {
		setBlocklist((prev) =>
			prev.map((user) => {
				if (
					user.id === nickOrId ||
					user.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					return { ...user, ...updates };
				}
				return user;
			})
		);
	}, [setBlocklist]);

	const updateLastSeen = useCallback((nick) => {
		const lowerNick = nick.toLowerCase();
		setFriends((prev) =>
			prev.map((friend) => {
				if (friend.nick === lowerNick) {
					return { ...friend, lastSeen: new Date().toISOString() };
				}
				return friend;
			})
		);
	}, [setFriends]);

	const addNetwork = useCallback((nickOrId, network) => {
		setFriends((prev) =>
			prev.map((friend) => {
				if (
					friend.id === nickOrId ||
					friend.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					if (friend.networks.includes(network)) {
						return friend;
					}
					return { ...friend, networks: [...friend.networks, network] };
				}
				return friend;
			})
		);
	}, [setFriends]);

	const removeNetwork = useCallback((nickOrId, network) => {
		setFriends((prev) =>
			prev.map((friend) => {
				if (
					friend.id === nickOrId ||
					friend.nick.toLowerCase() === nickOrId.toLowerCase()
				) {
					return {
						...friend,
						networks: friend.networks.filter((entry) => entry !== network),
					};
				}
				return friend;
			})
		);
	}, [setFriends]);

	const importFriends = useCallback((friendsData) => {
		setFriends((prev) => {
			const existingNicks = new Set(
				prev.map((friend) => friend.nick.toLowerCase())
			);
			const newFriends = friendsData
				.filter(
					(friend) => !existingNicks.has((friend.nick || '').toLowerCase())
				)
				.map((friend) => createFriend(friend.nick || friend.displayNick, friend));
			return [...prev, ...newFriends];
		});
	}, [setFriends]);

	const exportFriends = useCallback(() => [...friends], [friends]);

	return {
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

export { useFriendsActions };
