import { MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getNickColorClasses } from '../../irc/formatting.js';
import { formatLastSeen } from './helpers.js';

const FriendRow = ({ friend, onMessage, onEdit, onRemove, canMessage }) => {
	const [showActions, setShowActions] = useState(false);
	const displayName = friend.alias || friend.displayNick || friend.nick;
	const nickColor = getNickColorClasses(friend.displayNick || friend.nick);
	const avatarClass = nickColor ? nickColor.bg : 'bg-neutral-500';
	const nameClass = nickColor
		? nickColor.text
		: 'text-neutral-900 dark:text-neutral-100';

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
					onClick={() => {
						if (canMessage) {
							onMessage(friend);
						}
					}}
					disabled={!canMessage}
					className={`p-1.5 rounded transition-colors ${
						canMessage
							? 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400'
							: 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
					}`}
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

export { FriendRow };
