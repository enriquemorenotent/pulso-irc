import { NickContextMenu } from '../NickContextMenu.jsx';

const ConnectionsContextMenu = ({
	contextMenu,
	menuRef,
	resolveDmState,
	showChannelList,
	showCloseServer,
	showDisconnectServer,
	showReconnectServer,
	showClearLogs,
	showAutoJoin,
	showCloseDm,
	onClose,
	onOpenDm,
	onWhois,
	onAddFriend,
	onRemoveFriend,
	onBlockUser,
	onUnblockUser,
	onClearLogs,
	onCloseDm,
	onOpenChannelList,
	onDisconnect,
	onReconnect,
	onCloseServer,
	onPartChannel,
	onToggleAutoJoin,
	onToggleTargetNotify,
}) => {
	if (!contextMenu) {
		return null;
	}

	if (contextMenu.targetType === 'dm') {
		return (
			<NickContextMenu
				x={contextMenu.x}
				y={contextMenu.y}
				nick={contextMenu.targetName}
				showMessage={false}
				isFriend={resolveDmState(contextMenu.targetName).isFriend}
				isBlocked={resolveDmState(contextMenu.targetName).isBlocked}
				onClose={onClose}
				onOpenDm={(nick) => onOpenDm && onOpenDm(nick, contextMenu.connectionId)}
				onWhois={
					contextMenu.canDmWhois
						? (nick) => onWhois && onWhois(nick, contextMenu.connectionId)
						: null
				}
				onAddFriend={onAddFriend}
				onRemoveFriend={onRemoveFriend}
				onBlockUser={onBlockUser}
				onUnblockUser={onUnblockUser}
				onClearLogs={
					showClearLogs
						? (nick) => onClearLogs(contextMenu.connectionId, nick)
						: null
				}
				notifyEnabled={contextMenu.notifyEnabled}
				onToggleNotify={
					contextMenu.notifyAvailable ? onToggleTargetNotify : null
				}
				onCloseDm={
					showCloseDm
						? () =>
							onCloseDm(contextMenu.connectionId, contextMenu.targetName)
						: null
				}
				containerRef={menuRef}
			/>
		);
	}

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-[200px] rounded-md border border-neutral-200 bg-white shadow-lg py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
			style={{ top: contextMenu.y, left: contextMenu.x }}
		>
			{contextMenu.targetType === 'server' &&
			showChannelList &&
			contextMenu.canOpenChannelList ? (
				<button
					type="button"
					onClick={onOpenChannelList}
					className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
				>
					Channel list
				</button>
			) : null}
			{contextMenu.targetType === 'server' &&
			showDisconnectServer &&
			contextMenu.canDisconnectServer ? (
				<button
					type="button"
					onClick={onDisconnect}
					className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
				>
					Disconnect
				</button>
			) : null}
			{contextMenu.targetType === 'server' &&
			showReconnectServer &&
			contextMenu.canReconnectServer ? (
				<button
					type="button"
					onClick={onReconnect}
					className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
				>
					Reconnect
				</button>
			) : null}
			{contextMenu.targetType === 'server' &&
			showCloseServer &&
			contextMenu.canCloseServer ? (
				<button
					type="button"
					onClick={onCloseServer}
					className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
				>
					Close server
				</button>
			) : null}
			{contextMenu.targetType === 'channel' &&
			contextMenu.notifyAvailable ? (
				<button
					type="button"
					onClick={onToggleTargetNotify}
					className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
				>
					{contextMenu.notifyEnabled
						? 'Disable beep'
						: 'Enable beep'}
				</button>
			) : null}
			{contextMenu.targetType === 'channel' && showAutoJoin ? (
				<button
					type="button"
					onClick={onToggleAutoJoin}
					className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
				>
					{contextMenu.autoJoinEnabled
						? 'Remove from auto-join'
						: 'Add to auto-join'}
				</button>
			) : null}
			{contextMenu.targetType === 'channel' &&
			(contextMenu.canPartChannel || showClearLogs) &&
			(contextMenu.notifyAvailable || showAutoJoin) ? (
				<div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
			) : null}
			{contextMenu.targetType === 'channel' && showClearLogs ? (
				<button
					type="button"
					onClick={onClearLogs}
					className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
				>
					Clear logs
				</button>
			) : null}
			{contextMenu.targetType === 'channel' &&
			contextMenu.canPartChannel ? (
				<button
					type="button"
					onClick={onPartChannel}
					className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
				>
					Part channel
				</button>
			) : null}
		</div>
	);
};

export { ConnectionsContextMenu };
