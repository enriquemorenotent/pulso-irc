import { useState, useMemo } from 'react';
import { FriendsHeader } from './FriendsPanel/FriendsHeader.jsx';
import { FriendsSearch } from './FriendsPanel/FriendsSearch.jsx';
import { FriendsList } from './FriendsPanel/FriendsList.jsx';
import { EditFriendModal } from './FriendsPanel/EditFriendModal.jsx';

const FriendsPanel = ({
	friends,
	onRemoveFriend,
	onUpdateFriend,
	onOpenDm,
	canOpenDm,
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
				(f.displayNick && f.displayNick.toLowerCase().includes(query)) ||
				(f.notes && f.notes.toLowerCase().includes(query))
		);
	}, [friends, searchQuery]);

	const handleMessage = (friend) => {
		if (onOpenDm && canOpenDm) {
			onOpenDm(friend.displayNick || friend.nick);
		}
	};

	return (
		<section className="flex flex-col h-full bg-white dark:bg-neutral-900">
			<FriendsHeader
				friendsCount={friends.length}
				notificationsSupported={notificationsSupported}
				notificationsPermission={notificationsPermission}
				notificationsEnabled={notificationsEnabled}
				onRequestNotificationPermission={onRequestNotificationPermission}
				onToggleNotifications={onToggleNotifications}
				onClose={onClose}
			/>

			<FriendsSearch
				searchQuery={searchQuery}
				onChange={setSearchQuery}
			/>

			<div className="flex-1 overflow-y-auto">
				<FriendsList
					friends={filteredFriends}
					searchQuery={searchQuery.trim()}
					onMessage={handleMessage}
					canMessage={canOpenDm}
					onEdit={setEditingFriend}
					onRemove={onRemoveFriend}
				/>
			</div>

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
