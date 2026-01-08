import { useEffect, useRef, useState, useMemo } from 'react';
import { isAutoJoinEnabled } from '../irc/auto_join.js';
import { getNickColorClasses } from '../irc/formatting.js';
import { NickContextMenu } from './NickContextMenu.jsx';

const Icons = {
	Server: ({ className }) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
			<rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
			<line x1="6" y1="6" x2="6.01" y2="6"></line>
			<line x1="6" y1="18" x2="6.01" y2="18"></line>
		</svg>
	),
	Hash: ({ className }) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<line x1="4" y1="9" x2="20" y2="9"></line>
			<line x1="4" y1="15" x2="20" y2="15"></line>
			<line x1="10" y1="3" x2="8" y2="21"></line>
			<line x1="16" y1="3" x2="14" y2="21"></line>
		</svg>
	),
	User: ({ className }) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M20 21a8 8 0 0 0-16 0"></path>
			<circle cx="12" cy="7" r="4"></circle>
		</svg>
	),
	Power: ({ className }) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
			<line x1="12" y1="2" x2="12" y2="12"></line>
		</svg>
	),
	AlertCircle: ({ className }) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="12" y1="8" x2="12" y2="12"></line>
			<line x1="12" y1="16" x2="12.01" y2="16"></line>
		</svg>
	),
	Users: ({ className }) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	),
};

const SHOW_OFFLINE_FRIENDS_KEY = 'pulso_show_offline_friends';

const isChannelName = (name) =>
	Boolean(
		name &&
			(name.startsWith('#') ||
				name.startsWith('&') ||
				name.startsWith('+') ||
				name.startsWith('!'))
	);

const sortTargets = (targets) =>
	[...targets].sort((a, b) => {
		const aIsChannel = isChannelName(a);
		const bIsChannel = isChannelName(b);

		if (aIsChannel !== bIsChannel) {
			return aIsChannel ? -1 : 1;
		}

		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

const OnlineFriendsList = ({
	friends,
	onlineFriends,
	offlineFriends,
	onOpenDm,
	connectionLabelsById,
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
		const buttonClass = isOnline
			? 'w-full flex items-center gap-2 px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
			: 'w-full flex items-center gap-2 px-4 py-1.5 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors cursor-pointer dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300';

		return (
			<button
				type="button"
				onClick={() => onOpenDm(displayName, connectionId)}
				className={buttonClass}
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
					<Icons.Users className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
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
									{renderFriendRow(
										friend,
										connectionId,
										true
									)}
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

const statusMeta = {
	idle: { color: 'text-neutral-300', bg: 'bg-neutral-300' },
	connecting: { color: 'text-amber-500', bg: 'bg-amber-500' },
	authed: { color: 'text-blue-500', bg: 'bg-blue-500' },
	connected: { color: 'text-emerald-500', bg: 'bg-emerald-500' },
	closed: { color: 'text-neutral-300', bg: 'bg-neutral-300' },
	error: { color: 'text-red-500', bg: 'bg-red-500' },
};

const ConnectionItem = ({
	connection,
	isActive,
	onSelect,
	onDisconnect,
	statusTarget,
	onTargetContextMenu,
	friendNickSet,
	onCloseDm,
	onlineNicksByConnection,
}) => {
	const statusInfo =
		statusMeta[connection.chatState.status] || statusMeta.idle;
	const isStatusActive =
		isActive && connection.chatState.active === statusTarget;
	const canShowTargets = connection.chatState.status === 'connected';
	const targets = canShowTargets
		? sortTargets(
				connection.chatState.order.filter((name) => {
					if (name === statusTarget) {
						return false;
					}
					const target = connection.chatState.targets[name];
					if (!target) {
						return false;
					}
					if (!isChannelName(name)) {
						return true;
					}
					return Boolean(target.joined);
				})
			)
		: [];

	const showDisconnect = [
		'connecting',
		'authed',
		'connected',
		'error',
	].includes(connection.chatState.status);
	const isDmOnline = (nick) => {
		if (!nick || !onlineNicksByConnection) {
			return false;
		}
		const lowerNick = nick.toLowerCase();
		const connectionSet = onlineNicksByConnection.get(lowerNick);
		return Boolean(connectionSet && connectionSet.has(connection.id));
	};

	return (
		<div className="mb-2">
			<div className="px-2 mb-1">
				<button
					type="button"
					onClick={() => onSelect(connection.id, statusTarget)}
					className={`
                        w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-all group cursor-pointer
                        ${
							isStatusActive
								? 'bg-white text-neutral-800 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700'
								: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
						}
                    `}
				>
					<div className="flex items-center gap-2 overflow-hidden">
						<div
							className={`relative flex items-center justify-center w-5 h-5 rounded overflow-hidden ${
								isStatusActive
									? 'bg-neutral-50 text-neutral-600 dark:bg-neutral-900/30 dark:text-neutral-400'
									: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
							}`}
						>
							{connection.chatState.status === 'error' ? (
								<Icons.AlertCircle
									className={`w-3.5 h-3.5 ${statusInfo.color}`}
								/>
							) : (
								<Icons.Server className="w-3.5 h-3.5" />
							)}
							<div
								className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-neutral-800 ${statusInfo.bg}`}
							/>
						</div>
						<div className="flex-1 flex min-w-0 items-baseline">
							<span className="font-medium truncate block">
								{connection.profileName || 'Server'}
							</span>
							{connection.chatState.me && (
								<span className="font-normal text-xs text-neutral-400 ml-1.5 shrink-0 dark:text-neutral-500">
									({connection.chatState.me})
								</span>
							)}
						</div>
					</div>

					{showDisconnect && (
						<div
							role="button"
							onClick={(e) => {
								e.stopPropagation();
								onDisconnect(connection.id);
							}}
							className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded text-neutral-400 dark:text-neutral-500 transition-all cursor-pointer"
							title="Disconnect"
						>
							<Icons.Power className="w-3 h-3" />
						</div>
					)}
				</button>
			</div>

			<div className="flex flex-col gap-0.5 px-2">
				{targets.map((name) => {
					const target = connection.chatState.targets[name];
					const isActiveTarget =
						isActive && connection.chatState.active === name;
					const count =
						typeof target.unreadCount === 'number'
							? target.unreadCount
							: 0;
					const isChannel = isChannelName(name);
					const isOnlineDm = !isChannel && isDmOnline(name);
					const isFriendDm =
						!isChannel && friendNickSet?.has(name.toLowerCase());
					const autoJoinEnabled = isChannel
						? isAutoJoinEnabled(connection.autoJoin, name)
						: false;
					const targetType = isChannel ? 'channel' : 'dm';
					const canCloseDm = targetType === 'dm' && onCloseDm;

					return (
						<button
							key={name}
							type="button"
							onClick={() => onSelect(connection.id, name)}
							onContextMenu={(event) => {
								if (!onTargetContextMenu) {
									return;
								}
								onTargetContextMenu(
									event,
									connection.id,
									name,
									targetType,
									autoJoinEnabled
								);
							}}
							className={`
								group flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer
								${
									isActiveTarget
										? 'bg-neutral-200 text-neutral-900 font-semibold dark:bg-neutral-700 dark:text-white'
										: isChannel || isOnlineDm
										? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
										: 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-400'
								}
							`}
						>
							<div className="flex items-center gap-2 overflow-hidden pl-1">
								{isChannel ? (
									<Icons.Hash
										title={
											autoJoinEnabled
												? 'Auto-join'
												: undefined
										}
										className={`w-3.5 h-3.5 ${
											autoJoinEnabled
												? 'text-indigo-500 dark:text-indigo-400'
												: isActiveTarget
												? 'text-neutral-500 dark:text-neutral-300'
												: 'text-neutral-300 dark:text-neutral-600'
										}`}
									/>
								) : (
									<Icons.User
										className={`w-3.5 h-3.5 ${
											isFriendDm
												? isActiveTarget
													? 'text-amber-500 dark:text-amber-400'
													: 'text-amber-400 dark:text-amber-500'
												: isActiveTarget
												? 'text-neutral-500 dark:text-neutral-300'
												: 'text-neutral-300 dark:text-neutral-600'
										}`}
									/>
								)}
								<span className="truncate">{name}</span>
							</div>

							<div className="flex items-center gap-1">
								{count > 0 && !isActiveTarget && (
									<span className="px-1.5 py-0.5 text-[10px] font-bold leading-none bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 rounded-full min-w-[1.25rem] text-center">
										{count}
									</span>
								)}
								{canCloseDm && (
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											onCloseDm(connection.id, name);
										}}
										className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-all"
										title="Close DM"
									>
										<svg
											className="w-3 h-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

const ConnectionsSidebar = ({
	connections,
	activeConnectionId,
	onSelectTarget,
	onDisconnect,
	statusTarget,
	onToggleAutoJoin,
	onPartChannel,
	onCloseDm,
	friends,
	isBlocked,
	onOpenDm,
	isFriend,
	onAddFriend,
	onRemoveFriend,
	onBlockUser,
	onUnblockUser,
	onWhois,
	onClearLogs,
}) => {
	const [contextMenu, setContextMenu] = useState(null);
	const menuRef = useRef(null);
	const showAutoJoin = Boolean(onToggleAutoJoin);
	const showPart = Boolean(onPartChannel);
	const showCloseDm = Boolean(onCloseDm);
	const showClearLogs = Boolean(onClearLogs);
	const [showOfflineFriends, setShowOfflineFriends] = useState(() => {
		if (typeof window === 'undefined') {
			return false;
		}
		const stored = window.localStorage.getItem(SHOW_OFFLINE_FRIENDS_KEY);
		return stored === 'true';
	});

	// Collect all online nicks from all connections with their connection info
	const onlineNicksByConnection = useMemo(() => {
		const nickMap = new Map(); // nick -> Set of connectionIds
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

	// Filter friends who are online (and not blocked) with their connection info
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

	const resolveDmState = (nick) => {
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

	const closeMenu = () => setContextMenu(null);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}
		window.localStorage.setItem(
			SHOW_OFFLINE_FRIENDS_KEY,
			showOfflineFriends
		);
		return undefined;
	}, [showOfflineFriends]);

	useEffect(() => {
		if (!contextMenu) {
			return undefined;
		}

		const handleClick = (event) => {
			if (menuRef.current && menuRef.current.contains(event.target)) {
				return;
			}
			closeMenu();
		};

		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				closeMenu();
			}
		};

		const handleScroll = () => closeMenu();

		window.addEventListener('mousedown', handleClick);
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('scroll', handleScroll, true);

		return () => {
			window.removeEventListener('mousedown', handleClick);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('scroll', handleScroll, true);
		};
	}, [contextMenu]);

	const openContextMenu = (
		event,
		connectionId,
		targetName,
		targetType,
		autoJoinEnabled
	) => {
		const hasChannelActions =
			targetType === 'channel' &&
			(showAutoJoin || showPart || showClearLogs);
		const dmState = targetType === 'dm' ? resolveDmState(targetName) : null;
		const canDmMessage = false;
		const canDmWhois = targetType === 'dm' && Boolean(onWhois);
		const canDmFriend =
			targetType === 'dm' &&
			(dmState?.isFriend ? Boolean(onRemoveFriend) : Boolean(onAddFriend));
		const canDmBlock =
			targetType === 'dm' &&
			(dmState?.isBlocked
				? Boolean(onUnblockUser)
				: Boolean(onBlockUser));
		const canDmClearLogs = targetType === 'dm' && showClearLogs;
		const hasDmActions =
			targetType === 'dm' &&
			(canDmMessage ||
				canDmWhois ||
				canDmFriend ||
				canDmBlock ||
				showCloseDm ||
				canDmClearLogs);

		if (!hasChannelActions && !hasDmActions) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const menuWidth = 200;
		const menuRowHeight = 44;
		const menuHeaderHeight = 36;
		const menuRows =
			targetType === 'channel'
				? (showPart ? 1 : 0) +
				  (showClearLogs ? 1 : 0) +
				  (showAutoJoin ? 1 : 0)
				: (canDmMessage ? 1 : 0) +
				  (canDmWhois ? 1 : 0) +
				  (canDmFriend ? 1 : 0) +
				  (canDmBlock ? 1 : 0) +
				  (showCloseDm ? 1 : 0) +
				  (canDmClearLogs ? 1 : 0);
		const menuHeight =
			menuRowHeight * menuRows +
			(targetType === 'dm' ? menuHeaderHeight : 0);
		const padding = 12;
		const x = Math.min(
			event.clientX,
			window.innerWidth - menuWidth - padding
		);
		const y = Math.min(
			event.clientY,
			window.innerHeight - menuHeight - padding
		);

		setContextMenu({
			connectionId,
			targetName,
			targetType,
			autoJoinEnabled,
			x,
			y,
		});
	};

	const handleToggleAutoJoin = () => {
		if (!contextMenu || !onToggleAutoJoin) {
			return;
		}

		if (contextMenu.targetType !== 'channel') {
			return;
		}

		onToggleAutoJoin(contextMenu.connectionId, contextMenu.targetName);
		closeMenu();
	};

	const handlePartChannel = () => {
		if (!contextMenu || !onPartChannel) {
			return;
		}

		if (contextMenu.targetType !== 'channel') {
			return;
		}

		onPartChannel(contextMenu.connectionId, contextMenu.targetName);
		closeMenu();
	};

	const handleClearLogs = () => {
		if (!contextMenu || !onClearLogs) {
			return;
		}

		if (contextMenu.targetType !== 'channel') {
			return;
		}

		onClearLogs(contextMenu.connectionId, contextMenu.targetName);
		closeMenu();
	};

	return (
		<aside className="h-full w-64 bg-neutral-50 border-r border-neutral-200 flex flex-col font-sans relative dark:bg-neutral-900 dark:border-neutral-800">
			<div className="h-12 px-4 flex items-center border-b border-neutral-200/50 bg-neutral-50/50 backdrop-blur-sm sticky top-0 z-10 dark:border-neutral-800 dark:bg-neutral-900/50">
				<h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 select-none dark:text-neutral-500">
					Explorer
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto py-3">
				{connections.length > 0 ? (
					connections.map((connection) => (
						<ConnectionItem
							key={connection.id}
							connection={connection}
							isActive={connection.id === activeConnectionId}
							activeTarget={
								activeConnectionId === connection.id
									? connection.chatState.active
									: null
							}
							onSelect={onSelectTarget}
							onDisconnect={onDisconnect}
							statusTarget={statusTarget}
							onTargetContextMenu={openContextMenu}
							friendNickSet={friendNickSet}
							onCloseDm={onCloseDm}
							onlineNicksByConnection={onlineNicksByConnection}
						/>
					))
				) : (
					<div className="px-4 py-10 text-center">
						<div className="w-10 h-10 mx-auto bg-neutral-200/50 rounded-lg flex items-center justify-center mb-3 dark:bg-neutral-800">
							<Icons.Server className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
						</div>
						<p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
							No connections
						</p>
						<p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
							Connect to a server to start chatting
						</p>
					</div>
				)}
			</div>

			{/* Online Friends Section */}
			<OnlineFriendsList
				friends={friends}
				onlineFriends={onlineFriends}
				offlineFriends={offlineFriends}
				onOpenDm={onOpenDm}
				connectionLabelsById={connectionLabelsById}
				showOffline={showOfflineFriends}
				onToggleShowOffline={setShowOfflineFriends}
			/>

			{contextMenu ? (
				contextMenu.targetType === 'dm' ? (
					<NickContextMenu
						x={contextMenu.x}
						y={contextMenu.y}
						nick={contextMenu.targetName}
						showMessage={false}
						isFriend={
							resolveDmState(contextMenu.targetName).isFriend
						}
						isBlocked={
							resolveDmState(contextMenu.targetName).isBlocked
						}
						onClose={closeMenu}
						onOpenDm={(nick) =>
							onOpenDm && onOpenDm(nick, contextMenu.connectionId)
						}
						onWhois={(nick) =>
							onWhois && onWhois(nick, contextMenu.connectionId)
						}
						onAddFriend={onAddFriend}
						onRemoveFriend={onRemoveFriend}
						onBlockUser={onBlockUser}
						onUnblockUser={onUnblockUser}
						onClearLogs={
							showClearLogs
								? (nick) =>
										onClearLogs(
											contextMenu.connectionId,
											nick
										)
								: null
						}
						onCloseDm={
							showCloseDm
								? () =>
										onCloseDm(
											contextMenu.connectionId,
											contextMenu.targetName
										)
								: null
						}
						containerRef={menuRef}
					/>
				) : (
					<div
						ref={menuRef}
						className="fixed z-50 min-w-[200px] rounded-md border border-neutral-200 bg-white shadow-lg py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
						style={{ top: contextMenu.y, left: contextMenu.x }}
					>
						{contextMenu.targetType === 'channel' && showPart ? (
							<button
								type="button"
								onClick={handlePartChannel}
								className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
							>
								Part channel
							</button>
						) : null}
						{contextMenu.targetType === 'channel' &&
						showClearLogs ? (
							<button
								type="button"
								onClick={handleClearLogs}
								className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
							>
								Clear logs
							</button>
						) : null}
						{contextMenu.targetType === 'channel' &&
						(showPart || showClearLogs) &&
						showAutoJoin ? (
							<div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
						) : null}
						{contextMenu.targetType === 'channel' &&
						showAutoJoin ? (
							<button
								type="button"
								onClick={handleToggleAutoJoin}
								className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
							>
								{contextMenu.autoJoinEnabled
									? 'Remove from auto-join'
									: 'Add to auto-join'}
							</button>
						) : null}
					</div>
				)
			) : null}
		</aside>
	);
};

export { ConnectionsSidebar };
