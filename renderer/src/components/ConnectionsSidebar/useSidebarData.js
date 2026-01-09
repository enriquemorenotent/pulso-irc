import { useMemo } from 'react';

const useSidebarData = ({ connections, friends, isBlocked, isFriend }) => {
	const onlineNicksByConnection = useMemo(() => {
		const nickMap = new Map();
		connections.forEach((connection) => {
			const targets = connection.chatState?.targets || {};
			Object.values(targets).forEach((target) => {
				if (target.users) {
					Object.keys(target.users).forEach((nick) => {
						const lowerNick = nick.toLowerCase();
						if (!nickMap.has(lowerNick)) {
							nickMap.set(lowerNick, new Set());
						}
						nickMap.get(lowerNick).add(connection.id);
					});
				}
			});
		});
		return nickMap;
	}, [connections]);

	const onlineFriends = useMemo(() => {
		if (!friends) return [];
		return friends
			.filter(
				(friend) =>
					(!isBlocked || !isBlocked(friend.nick)) &&
					onlineNicksByConnection.has(friend.nick.toLowerCase())
			)
			.map((friend) => ({
				...friend,
				onlineConnections: Array.from(
					onlineNicksByConnection.get(friend.nick.toLowerCase()) || []
				),
			}));
	}, [friends, isBlocked, onlineNicksByConnection]);

	const offlineFriends = useMemo(() => {
		if (!friends) return [];
		return friends.filter(
			(friend) =>
				(!isBlocked || !isBlocked(friend.nick)) &&
				!onlineNicksByConnection.has(friend.nick.toLowerCase())
		);
	}, [friends, isBlocked, onlineNicksByConnection]);

	const friendNickSet = useMemo(() => {
		if (!friends) return new Set();
		return new Set(friends.map((friend) => friend.nick.toLowerCase()));
	}, [friends]);

	const resolveDmState = useMemo(() => {
		return (nick) => {
			if (!nick) {
				return { isFriend: false, isBlocked: false };
			}
			const lowerNick = nick.toLowerCase();
			const isFriendTarget = isFriend
				? isFriend(nick)
				: friendNickSet.has(lowerNick);
			const isBlockedTarget = isBlocked ? isBlocked(nick) : false;
			return { isFriend: isFriendTarget, isBlocked: isBlockedTarget };
		};
	}, [friendNickSet, isBlocked, isFriend]);

	const connectionLabelsById = useMemo(() => {
		const labels = new Map();
		connections.forEach((connection) => {
			const label =
				connection.profileName ||
				connection.settings?.host ||
				connection.chatState?.server ||
				'Server';
			labels.set(connection.id, label);
		});
		return labels;
	}, [connections]);

	return {
		onlineNicksByConnection,
		onlineFriends,
		offlineFriends,
		friendNickSet,
		resolveDmState,
		connectionLabelsById,
	};
};

export { useSidebarData };
