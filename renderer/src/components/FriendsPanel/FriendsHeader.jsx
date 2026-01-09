import { Bell, X } from 'lucide-react';

const BellIcon = ({ enabled }) => (
	<Bell
		className={`w-4 h-4 ${enabled ? 'text-blue-500' : ''}`}
		fill={enabled ? 'currentColor' : 'none'}
	/>
);

const FriendsHeader = ({
	friendsCount,
	notificationsSupported,
	notificationsPermission,
	notificationsEnabled,
	onRequestNotificationPermission,
	onToggleNotifications,
	onClose,
}) => (
	<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
		<div>
			<h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Friends</h2>
			<p className="text-sm text-neutral-500 dark:text-neutral-400">
				{friendsCount} {friendsCount === 1 ? 'friend' : 'friends'}
			</p>
		</div>
		<div className="flex items-center gap-2">
			{notificationsSupported && (
				<button
					type="button"
					onClick={() => {
						if (notificationsPermission === 'default') {
							onRequestNotificationPermission();
						} else if (notificationsPermission === 'granted') {
							onToggleNotifications(!notificationsEnabled);
						}
					}}
					className={`p-2 rounded-lg transition-colors ${
						notificationsEnabled
							? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
							: 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
					}`}
					title={
						notificationsPermission === 'denied'
							? 'Notifications blocked by browser'
							: notificationsPermission === 'default'
							? 'Enable notifications for friend activity'
							: notificationsEnabled
							? 'Notifications enabled - click to disable'
							: 'Notifications disabled - click to enable'
					}
					disabled={notificationsPermission === 'denied'}
				>
					<BellIcon enabled={notificationsEnabled} />
				</button>
			)}
			{onClose && (
				<button
					type="button"
					onClick={onClose}
					className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
			)}
		</div>
	</div>
);

export { FriendsHeader };
