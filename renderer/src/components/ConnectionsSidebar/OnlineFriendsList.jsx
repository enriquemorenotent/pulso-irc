import { Users } from 'lucide-react';
import { useMemo } from 'react';
import { getNickColorClasses } from '../../irc/formatting.js';

const OnlineFriendsList = ({
	friends,
	onlineFriends,
	offlineFriends,
	onOpenDm,
	connectionLabelsById,
	isConnectionConnected,
	canStartDm,
	showOffline,
	onToggleShowOffline,
}) => {
	const groupedFriends = useMemo(() => {
		if (!friends || friends.length === 0) {
			return [];
		}
		if (!onlineFriends || onlineFriends.length === 0) {
			return [];
		}
		const groups = new Map();
		onlineFriends.forEach((friend) => {
			const connectionIds = Array.isArray(friend.onlineConnections)
				? friend.onlineConnections
				: [];
			connectionIds.forEach((connectionId) => {
				const label =
					connectionLabelsById?.get(connectionId) || 'Server';
				if (!groups.has(label)) {
					groups.set(label, {
						label,
						items: [],
						seen: new Set(),
					});
				}
				const group = groups.get(label);
				const friendKey =
					friend.id || friend.displayNick || friend.nick;
				if (group.seen.has(friendKey)) {
					return;
				}
				group.items.push({ friend, connectionId });
				group.seen.add(friendKey);
			});
		});
		return Array.from(groups.values()).map((group) => ({
			label: group.label,
			items: group.items,
		}));
	}, [friends, onlineFriends, connectionLabelsById]);

	if (!friends || friends.length === 0) {
		return null;
	}

	const renderFriendRow = (friend, connectionId, isOnline) => {
		const displayName = friend.alias || friend.displayNick || friend.nick;
		const nickColor = getNickColorClasses(friend.displayNick || friend.nick);
		const avatarClass = nickColor ? nickColor.bg : 'bg-neutral-500';
		const canOpen =
			Boolean(onOpenDm) &&
			(connectionId
				? isConnectionConnected && isConnectionConnected(connectionId)
				: Boolean(canStartDm));
		const buttonClass = isOnline
			? 'w-full flex items-center gap-2 px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
			: 'w-full flex items-center gap-2 px-4 py-1.5 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors cursor-pointer dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300';
		const disabledClass = canOpen ? '' : 'opacity-60 cursor-not-allowed';

		return (
			<button
				type="button"
				onClick={() => {
					if (!canOpen) {
						return;
					}
					onOpenDm(displayName, connectionId || null);
				}}
				disabled={!canOpen}
				className={`${buttonClass} ${disabledClass}`}
				title={`Message ${displayName}`}
			>
				<div className="relative">
					<div
						className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${avatarClass}`}
					>
						{displayName[0].toUpperCase()}
					</div>
					<div
						className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-neutral-50 dark:ring-neutral-900 ${
							isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
						}`}
					/>
				</div>
				<div className="min-w-0">
					<span className="truncate font-medium block">
						{displayName}
					</span>
				</div>
			</button>
		);
	};

	const hasOffline =
		showOffline && offlineFriends && offlineFriends.length > 0;
	const listHeightClass = showOffline ? 'max-h-[45vh]' : 'max-h-40';

	return (
		<div className="border-t border-neutral-200 dark:border-neutral-800">
			<div className="h-10 px-4 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
				<div className="flex items-center gap-2">
					<Users className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
					<span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 select-none dark:text-neutral-500">
						Friends
					</span>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() =>
							onToggleShowOffline &&
							onToggleShowOffline(!showOffline)
						}
						aria-pressed={showOffline}
						className="flex items-center gap-2 text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors dark:text-neutral-500 dark:hover:text-neutral-300"
						title={
							showOffline
								? 'Hide offline friends'
								: 'Show offline friends'
						}
					>
						<span>Offline</span>
						<span
							className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
								showOffline
									? 'bg-emerald-500/80'
									: 'bg-neutral-300 dark:bg-neutral-700'
							}`}
						>
							<span
								className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
									showOffline
										? 'translate-x-3'
										: 'translate-x-1'
								}`}
							/>
						</span>
					</button>
				</div>
			</div>
			<div className={`${listHeightClass} overflow-y-auto py-1`}>
				{groupedFriends.length > 0 ? (
					groupedFriends.map((group) => (
						<div key={group.label} className="pb-1">
							<div className="px-4 pt-2 pb-1 flex items-center justify-between">
								<span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
									{group.label}
								</span>
								<span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
									{group.items.length}
								</span>
							</div>
							{group.items.map(({ friend, connectionId }) => (
								<div
									key={`${group.label}-${
										friend.id || friend.nick
									}`}
								>
									{renderFriendRow(friend, connectionId, true)}
								</div>
							))}
						</div>
					))
				) : (
					<div className="px-4 py-3 text-center">
						<p className="text-xs text-neutral-400 dark:text-neutral-500">
							No friends online
						</p>
					</div>
				)}
				{hasOffline && (
					<div className="pb-1">
						<div className="px-4 pt-2 pb-1 flex items-center justify-between">
							<span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
								Offline
							</span>
							<span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
								{offlineFriends.length}
							</span>
						</div>
						{offlineFriends.map((friend) => (
							<div key={`offline-${friend.id || friend.nick}`}>
								{renderFriendRow(friend, null, false)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export { OnlineFriendsList };
