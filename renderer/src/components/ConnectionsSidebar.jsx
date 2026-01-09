import { Server } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConnectionItem } from './ConnectionsSidebar/ConnectionItem.jsx';
import { OnlineFriendsList } from './ConnectionsSidebar/OnlineFriendsList.jsx';
import { ConnectionsContextMenu } from './ConnectionsSidebar/ConnectionsContextMenu.jsx';
import { useSidebarData } from './ConnectionsSidebar/useSidebarData.js';
import { useConnectionsContextMenu } from './ConnectionsSidebar/useContextMenu.js';

const SHOW_OFFLINE_FRIENDS_KEY = 'pulso_show_offline_friends';

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
	onOpenChannelList,
}) => {
	const showAutoJoin = Boolean(onToggleAutoJoin);
	const showPart = Boolean(onPartChannel);
	const showCloseDm = Boolean(onCloseDm);
	const showClearLogs = Boolean(onClearLogs);
	const showChannelList = Boolean(onOpenChannelList);
	const [showOfflineFriends, setShowOfflineFriends] = useState(() => {
		if (typeof window === 'undefined') {
			return false;
		}
		const stored = window.localStorage.getItem(SHOW_OFFLINE_FRIENDS_KEY);
		return stored === 'true';
	});

	const {
		onlineNicksByConnection,
		onlineFriends,
		offlineFriends,
		friendNickSet,
		resolveDmState,
		connectionLabelsById,
	} = useSidebarData({ connections, friends, isBlocked, isFriend });

	const {
		contextMenu,
		menuRef,
		openContextMenu,
		closeMenu,
		handleToggleAutoJoin,
		handlePartChannel,
		handleClearLogs,
		handleOpenChannelList,
	} = useConnectionsContextMenu({
		showAutoJoin,
		showPart,
		showCloseDm,
		showClearLogs,
		showChannelList,
		onToggleAutoJoin,
		onPartChannel,
		onClearLogs,
		onOpenChannelList,
		onWhois,
		onAddFriend,
		onRemoveFriend,
		onBlockUser,
		onUnblockUser,
		resolveDmState,
	});

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
							<Server className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
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

			<OnlineFriendsList
				friends={friends}
				onlineFriends={onlineFriends}
				offlineFriends={offlineFriends}
				onOpenDm={onOpenDm}
				connectionLabelsById={connectionLabelsById}
				showOffline={showOfflineFriends}
				onToggleShowOffline={setShowOfflineFriends}
			/>

			<ConnectionsContextMenu
				contextMenu={contextMenu}
				menuRef={menuRef}
				resolveDmState={resolveDmState}
				showChannelList={showChannelList}
				showPart={showPart}
				showClearLogs={showClearLogs}
				showAutoJoin={showAutoJoin}
				showCloseDm={showCloseDm}
				onClose={closeMenu}
				onOpenDm={onOpenDm}
				onWhois={onWhois}
				onAddFriend={onAddFriend}
				onRemoveFriend={onRemoveFriend}
				onBlockUser={onBlockUser}
				onUnblockUser={onUnblockUser}
				onClearLogs={handleClearLogs}
				onCloseDm={onCloseDm}
				onOpenChannelList={handleOpenChannelList}
				onPartChannel={handlePartChannel}
				onToggleAutoJoin={handleToggleAutoJoin}
			/>
		</aside>
	);
};

export { ConnectionsSidebar };
