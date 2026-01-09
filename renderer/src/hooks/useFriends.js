import { useEffect, useState } from 'react';
import {
	loadFriends,
	loadBlocklist,
	persistFriends,
	persistBlocklist,
} from '../irc/friends.js';
import { useFriendsSelectors } from './useFriends/selectors.js';
import { useFriendsActions } from './useFriends/actions.js';

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

	const { sortedFriends, sortedBlocklist, friendsByNick, blockedByNick } =
		useFriendsSelectors({ friends, blocklist });
	const {
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
	} = useFriendsActions({
		friends,
		friendsByNick,
		blockedByNick,
		setFriends,
		setBlocklist,
	});

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
