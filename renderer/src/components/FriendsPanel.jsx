import {
	Bell,
	MessageCircle,
	Pencil,
	Search,
	Trash2,
	Users,
	X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { getNickColorClasses } from '../irc/formatting.js';
import { inputClass } from '../ui/classes.js';

const BellIcon = ({ enabled }) => (
	<Bell
		className={`w-4 h-4 ${enabled ? 'text-blue-500' : ''}`}
		fill={enabled ? 'currentColor' : 'none'}
	/>
);

const formatLastSeen = (isoString) => {
	if (!isoString) return 'Never';
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
};

const FriendRow = ({ friend, onMessage, onEdit, onRemove }) => {
	const [showActions, setShowActions] = useState(false);
	const displayName = friend.alias || friend.displayNick || friend.nick;
	const nickColor = getNickColorClasses(friend.displayNick || friend.nick);
	const avatarClass = nickColor ? nickColor.bg : 'bg-neutral-500';
	const nameClass = nickColor ? nickColor.text : 'text-neutral-900 dark:text-neutral-100';

	return (
		<div
			className="group flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => setShowActions(false)}
		>
			<div className="flex-shrink-0">
				<div
					className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${avatarClass}`}
				>
					{displayName[0].toUpperCase()}
				</div>
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className={`font-medium text-sm truncate ${nameClass}`}>
						{displayName}
					</span>
					{friend.alias && (
						<span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
							({friend.displayNick})
						</span>
					)}
				</div>
				<div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
					<span>Last seen: {formatLastSeen(friend.lastSeen)}</span>
					{friend.networks.length > 0 && (
						<>
							<span>•</span>
							<span className="truncate">
								{friend.networks.join(', ')}
							</span>
						</>
					)}
				</div>
				{friend.notes && (
					<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
						{friend.notes}
					</p>
				)}
			</div>

			<div
				className={`flex items-center gap-1 transition-opacity ${
					showActions ? 'opacity-100' : 'opacity-0'
				}`}
			>
				<button
					type="button"
					onClick={() => onMessage(friend)}
					className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors"
					title="Send message"
				>
					<MessageCircle className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => onEdit(friend)}
					className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
					title="Edit friend"
				>
					<Pencil className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => onRemove(friend.id)}
					className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 transition-colors"
					title="Remove friend"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};

const EditFriendModal = ({ friend, onSave, onClose }) => {
	const [nick, setNick] = useState(friend.displayNick || friend.nick);
	const [alias, setAlias] = useState(friend.alias || '');
	const [notes, setNotes] = useState(friend.notes || '');

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!nick.trim()) return;
		onSave(friend.id, {
			nick: nick.trim(),
			displayNick: nick.trim(),
			alias: alias.trim(),
			notes: notes.trim(),
		});
		onClose();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
					<h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
						Edit Friend
					</h3>
				</div>
				<form onSubmit={handleSubmit} className="p-6">
					<div className="grid gap-4">
						<div>
							<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
								Nick
							</label>
							<input
								type="text"
								value={nick}
								onChange={(e) => setNick(e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
								Alias
							</label>
							<input
								type="text"
								value={alias}
								onChange={(e) => setAlias(e.target.value)}
								placeholder="Optional display name"
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
								Notes
							</label>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Add notes about this friend"
								className={`${inputClass} resize-none`}
								rows={3}
							/>
						</div>
					</div>
					<div className="flex gap-3 justify-end mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!nick.trim()}
							className="px-4 py-2 text-sm font-medium bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-600 dark:hover:bg-neutral-500 transition-colors"
						>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const FriendsPanel = ({
	friends,
	onRemoveFriend,
	onUpdateFriend,
	onOpenDm,
	onClose,
	notificationsEnabled,
	notificationsPermission,
	notificationsSupported,
	onRequestNotificationPermission,
	onToggleNotifications,
}) => {
	const [editingFriend, setEditingFriend] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	const filteredFriends = useMemo(() => {
		if (!searchQuery.trim()) return friends;

		const query = searchQuery.toLowerCase();
		return friends.filter(
			(f) =>
				f.nick.toLowerCase().includes(query) ||
				(f.alias && f.alias.toLowerCase().includes(query)) ||
				(f.displayNick &&
					f.displayNick.toLowerCase().includes(query)) ||
				(f.notes && f.notes.toLowerCase().includes(query))
		);
	}, [friends, searchQuery]);

	const handleMessage = (friend) => {
		if (onOpenDm) {
			onOpenDm(friend.displayNick || friend.nick);
		}
	};

	return (
		<section className="flex flex-col h-full bg-white dark:bg-neutral-900">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
				<div>
					<h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
						Friends
					</h2>
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						{friends.length}{' '}
						{friends.length === 1 ? 'friend' : 'friends'}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{notificationsSupported && (
						<button
							type="button"
							onClick={() => {
								if (notificationsPermission === 'default') {
									onRequestNotificationPermission();
								} else if (
									notificationsPermission === 'granted'
								) {
									onToggleNotifications(
										!notificationsEnabled
									);
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

			{/* Search */}
			<div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search friends..."
						className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
					/>
				</div>
			</div>

			{/* Friends List */}
			<div className="flex-1 overflow-y-auto">
				{filteredFriends.length > 0 ? (
					<div className="divide-y divide-neutral-100 dark:divide-neutral-800">
						{filteredFriends.map((friend) => (
							<FriendRow
								key={friend.id}
								friend={friend}
								onMessage={handleMessage}
								onEdit={setEditingFriend}
								onRemove={onRemoveFriend}
							/>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center p-8">
						<div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
							<Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500" strokeWidth={1.5} />
						</div>
						<h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
							{searchQuery
								? 'No friends found'
								: 'No friends yet'}
						</h3>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							{searchQuery
								? 'Try a different search term'
								: 'Add friends to start building your list'}
						</p>
					</div>
				)}
			</div>

			{/* Edit Modal */}
			{editingFriend && (
				<EditFriendModal
					friend={editingFriend}
					onSave={onUpdateFriend}
					onClose={() => setEditingFriend(null)}
				/>
			)}
		</section>
	);
};

export { FriendsPanel };
