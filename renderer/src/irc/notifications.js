/**
 * Browser notifications utility for Pulso IRC
 */

const NOTIFICATION_PERMISSION_KEY = 'pulso_notifications_enabled';

/**
 * Check if notifications are supported
 */
const isSupported = () => {
	return 'Notification' in window;
};

/**
 * Get current permission status
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
const getPermission = () => {
	if (!isSupported()) {
		return 'unsupported';
	}
	return Notification.permission;
};

/**
 * Check if notifications are enabled (permission granted + user preference)
 */
const isEnabled = () => {
	if (!isSupported()) {
		return false;
	}
	if (Notification.permission !== 'granted') {
		return false;
	}
	// Check user preference
	try {
		const pref = window.localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
		return pref !== 'false';
	} catch {
		return true;
	}
};

/**
 * Request notification permission
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
const requestPermission = async () => {
	if (!isSupported()) {
		return 'unsupported';
	}
	try {
		const result = await Notification.requestPermission();
		if (result === 'granted') {
			setEnabled(true);
		}
		return result;
	} catch {
		return 'denied';
	}
};

/**
 * Set user preference for notifications
 */
const setEnabled = (enabled) => {
	try {
		window.localStorage.setItem(
			NOTIFICATION_PERMISSION_KEY,
			enabled ? 'true' : 'false'
		);
	} catch {
		// Ignore storage errors
	}
};

/**
 * Show a notification
 * @param {string} title
 * @param {Object} options
 * @param {string} options.body
 * @param {string} options.icon
 * @param {string} options.tag - Unique tag to prevent duplicate notifications
 * @param {Function} options.onClick
 * @returns {Notification | null}
 */
const show = (title, options = {}) => {
	if (!isEnabled()) {
		return null;
	}

	try {
		const notification = new Notification(title, {
			body: options.body || '',
			icon: options.icon || '/favicon.ico',
			tag: options.tag,
			silent: options.silent || false,
		});

		if (options.onClick) {
			notification.onclick = (event) => {
				event.preventDefault();
				window.focus();
				options.onClick();
				notification.close();
			};
		}

		// Auto-close after 5 seconds
		if (options.autoClose !== false) {
			setTimeout(() => notification.close(), 5000);
		}

		return notification;
	} catch {
		return null;
	}
};

/**
 * Show a "friend online" notification
 * @param {Object} friend - Friend object
 * @param {string} friend.nick
 * @param {string} friend.alias
 * @param {string} friend.displayNick
 * @param {Function} onClickFn - Called when notification is clicked
 */
const showFriendOnline = (friend, onClickFn) => {
	const displayName = friend.alias || friend.displayNick || friend.nick;

	return show(`${displayName} is online`, {
		body: 'Click to send a message',
		tag: `friend-online-${friend.nick.toLowerCase()}`,
		onClick: onClickFn,
	});
};

/**
 * Show a "mention" notification when user's nick is mentioned in a channel
 * @param {string} from - Nick of the person who sent the message
 * @param {string} channel - Channel where the mention occurred
 * @param {string} text - Message text
 * @param {Function} onClickFn - Called when notification is clicked
 */
const showMention = (from, channel, text, onClickFn) => {
	// Truncate long messages
	const truncatedText =
		text.length > 100 ? text.substring(0, 100) + '...' : text;

	return show(`${from} mentioned you in ${channel}`, {
		body: truncatedText,
		tag: `mention-${channel}-${Date.now()}`,
		onClick: onClickFn,
	});
};

/**
 * Show a "direct message" notification
 * @param {string} from - Nick of the person who sent the message
 * @param {string} text - Message text
 * @param {Function} onClickFn - Called when notification is clicked
 */
const showDirectMessage = (from, text, onClickFn) => {
	// Truncate long messages
	const truncatedText =
		text.length > 100 ? text.substring(0, 100) + '...' : text;

	return show(`Message from ${from}`, {
		body: truncatedText,
		tag: `dm-${from.toLowerCase()}-${Date.now()}`,
		onClick: onClickFn,
	});
};

export {
	isSupported,
	getPermission,
	isEnabled,
	requestPermission,
	setEnabled,
	show,
	showFriendOnline,
	showMention,
	showDirectMessage,
};
