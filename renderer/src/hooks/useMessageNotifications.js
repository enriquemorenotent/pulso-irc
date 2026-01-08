import { useEffect, useRef, useCallback } from 'react';
import * as notifications from '../irc/notifications.js';

/**
 * Hook to show notifications for mentions and DMs
 * @param {Array} connections - List of connections with chat state
 * @param {Function} onSelectTarget - Function to navigate to a target
 * @param {boolean} notificationsEnabled - Whether notifications are enabled
 */
const useMessageNotifications = (
	connections,
	onSelectTarget,
	notificationsEnabled
) => {
	// Track seen message IDs to avoid duplicate notifications
	const seenMessagesRef = useRef(new Set());
	const isInitializedRef = useRef(false);

	// Check if a target is currently active (visible)
	const isTargetActive = useCallback(
		(connectionId, targetName) => {
			const connection = connections.find((c) => c.id === connectionId);
			if (!connection) return false;
			return connection.chatState?.active === targetName;
		},
		[connections]
	);

	// Process messages and show notifications
	useEffect(() => {
		if (!notificationsEnabled || !connections) return;

		// Skip initial load to avoid notification flood
		if (!isInitializedRef.current) {
			// Mark all existing messages as seen
			connections.forEach((connection) => {
				const targets = connection.chatState?.targets || {};
				Object.values(targets).forEach((target) => {
					(target.messages || []).forEach((msg) => {
						if (msg.id) {
							seenMessagesRef.current.add(msg.id);
						}
					});
				});
			});
			isInitializedRef.current = true;
			return;
		}

		// Check for new messages
		connections.forEach((connection) => {
			const connectionId = connection.id;
			const me = connection.chatState?.me?.toLowerCase();
			const targets = connection.chatState?.targets || {};

			Object.entries(targets).forEach(([targetName, target]) => {
				const messages = target.messages || [];
				const targetType = target.type;

				messages.forEach((msg) => {
					// Skip if already seen
					if (!msg.id || seenMessagesRef.current.has(msg.id)) {
						return;
					}

					// Mark as seen
					seenMessagesRef.current.add(msg.id);

					// Skip system messages, joins, parts, etc.
					if (msg.type !== 'message' && msg.type !== 'action') {
						return;
					}

					// Skip own messages
					if (me && msg.from?.toLowerCase() === me) {
						return;
					}

					// Skip if target is currently active and window is focused
					if (
						document.hasFocus() &&
						isTargetActive(connectionId, targetName)
					) {
						return;
					}

					// Check for DM
					if (targetType === 'dm') {
						notifications.showDirectMessage(
							msg.from,
							msg.text || '',
							() => {
								if (onSelectTarget) {
									onSelectTarget(connectionId, targetName);
								}
							}
						);
						return;
					}

					// Check for mention (highlight)
					if (msg.highlight && targetType === 'channel') {
						notifications.showMention(
							msg.from,
							targetName,
							msg.text || '',
							() => {
								if (onSelectTarget) {
									onSelectTarget(connectionId, targetName);
								}
							}
						);
					}
				});
			});
		});

		// Cleanup old message IDs periodically to prevent memory growth
		// Keep only the last 1000 IDs
		if (seenMessagesRef.current.size > 2000) {
			const arr = Array.from(seenMessagesRef.current);
			seenMessagesRef.current = new Set(arr.slice(-1000));
		}
	}, [connections, notificationsEnabled, isTargetActive, onSelectTarget]);
};

export { useMessageNotifications };
