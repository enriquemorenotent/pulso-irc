import { useEffect, useRef, useCallback, useState } from 'react';
import * as notifications from '../irc/notifications.js';

/**
 * Hook to track friend online status and show notifications
 * @param {Array} friends - List of friends
 * @param {Array} connections - List of connections with chat state
 * @param {Function} isBlocked - Function to check if a nick is blocked
 * @param {Function} onOpenDm - Function to open a DM with a friend
 */
const useFriendNotifications = (friends, connections, isBlocked, onOpenDm) => {
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		notifications.isEnabled()
	);
	const previousOnlineRef = useRef(new Set());
	const isInitializedRef = useRef(false);

	// Collect all online friend nicks
	const getOnlineFriendNicks = useCallback(() => {
		if (!friends || !connections) return new Set();

		// Build set of all online nicks across connections
		const onlineNicks = new Set();
		connections.forEach((connection) => {
			const targets = connection.chatState?.targets || {};
			Object.values(targets).forEach((target) => {
				if (target.users) {
					Object.keys(target.users).forEach((nick) => {
						onlineNicks.add(nick.toLowerCase());
					});
				}
			});
		});

		// Filter to just friends (not blocked)
		const onlineFriendNicks = new Set();
		friends.forEach((friend) => {
			const lowerNick = friend.nick.toLowerCase();
			if (
				onlineNicks.has(lowerNick) &&
				(!isBlocked || !isBlocked(friend.nick))
			) {
				onlineFriendNicks.add(lowerNick);
			}
		});

		return onlineFriendNicks;
	}, [friends, connections, isBlocked]);

	// Find connection where friend is online
	const findFriendConnection = useCallback(
		(friendNick) => {
			const lowerNick = friendNick.toLowerCase();
			for (const connection of connections || []) {
				const targets = connection.chatState?.targets || {};
				for (const target of Object.values(targets)) {
					if (target.users) {
						const nicks = Object.keys(target.users).map((n) =>
							n.toLowerCase()
						);
						if (nicks.includes(lowerNick)) {
							return connection.id;
						}
					}
				}
			}
			return null;
		},
		[connections]
	);

	// Check for newly online friends and notify
	useEffect(() => {
		if (!notificationsEnabled) return;

		const currentOnline = getOnlineFriendNicks();

		// Skip notifications on initial load
		if (!isInitializedRef.current) {
			isInitializedRef.current = true;
			previousOnlineRef.current = currentOnline;
			return;
		}

		// Find friends who just came online
		const newlyOnline = new Set();
		currentOnline.forEach((nick) => {
			if (!previousOnlineRef.current.has(nick)) {
				newlyOnline.add(nick);
			}
		});

		// Show notifications for newly online friends
		if (newlyOnline.size > 0 && friends) {
			newlyOnline.forEach((lowerNick) => {
				const friend = friends.find(
					(f) => f.nick.toLowerCase() === lowerNick
				);
				if (friend) {
					const connectionId = findFriendConnection(friend.nick);
					notifications.showFriendOnline(friend, () => {
						if (onOpenDm) {
							onOpenDm(
								friend.displayNick || friend.nick,
								connectionId
							);
						}
					});
				}
			});
		}

		previousOnlineRef.current = currentOnline;
	}, [
		friends,
		getOnlineFriendNicks,
		findFriendConnection,
		onOpenDm,
		notificationsEnabled,
	]);

	// Request permission
	const requestPermission = useCallback(async () => {
		const result = await notifications.requestPermission();
		setNotificationsEnabled(result === 'granted');
		return result;
	}, []);

	// Toggle notifications
	const toggleNotifications = useCallback((enabled) => {
		notifications.setEnabled(enabled);
		setNotificationsEnabled(
			enabled && notifications.getPermission() === 'granted'
		);
	}, []);

	return {
		notificationsEnabled,
		notificationsPermission: notifications.getPermission(),
		notificationsSupported: notifications.isSupported(),
		requestNotificationPermission: requestPermission,
		toggleNotifications,
	};
};

export { useFriendNotifications };
