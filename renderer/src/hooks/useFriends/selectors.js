import { useMemo } from 'react';
import { sortFriends, sortBlocklist } from '../../irc/friends.js';

const useFriendsSelectors = ({ friends, blocklist }) => {
	const sortedFriends = useMemo(() => sortFriends(friends), [friends]);
	const sortedBlocklist = useMemo(() => sortBlocklist(blocklist), [blocklist]);

	const friendsByNick = useMemo(() => {
		const map = new Map();
		friends.forEach((friend) => {
			map.set(friend.nick.toLowerCase(), friend);
		});
		return map;
	}, [friends]);

	const blockedByNick = useMemo(() => {
		const map = new Map();
		blocklist.forEach((user) => {
			map.set(user.nick.toLowerCase(), user);
		});
		return map;
	}, [blocklist]);

	return {
		sortedFriends,
		sortedBlocklist,
		friendsByNick,
		blockedByNick,
	};
};

export { useFriendsSelectors };
