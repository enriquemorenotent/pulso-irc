import { Users } from 'lucide-react';
import { FriendRow } from './FriendRow.jsx';

const FriendsList = ({ friends, searchQuery, onMessage, onEdit, onRemove }) => {
	if (!friends.length) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-8">
				<div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
					<Users
						className="w-8 h-8 text-neutral-400 dark:text-neutral-500"
						strokeWidth={1.5}
					/>
				</div>
				<h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
					{searchQuery ? 'No friends found' : 'No friends yet'}
				</h3>
				<p className="text-sm text-neutral-500 dark:text-neutral-400">
					{searchQuery
						? 'Try a different search term'
						: 'Add friends to start building your list'}
				</p>
			</div>
		);
	}

	return (
		<div className="divide-y divide-neutral-100 dark:divide-neutral-800">
			{friends.map((friend) => (
				<FriendRow
					key={friend.id}
					friend={friend}
					onMessage={onMessage}
					onEdit={onEdit}
					onRemove={onRemove}
				/>
			))}
		</div>
	);
};

export { FriendsList };
