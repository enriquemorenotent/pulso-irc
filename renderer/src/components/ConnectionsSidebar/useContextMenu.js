import { useEffect, useRef, useState } from 'react';

const useConnectionsContextMenu = ({
	showAutoJoin,
	showPart,
	showCloseDm,
	showClearLogs,
	showChannelList,
	showCloseServer,
	showDisconnectServer,
	showReconnectServer,
	onToggleAutoJoin,
	onPartChannel,
	onClearLogs,
	onOpenChannelList,
	onDisconnect,
	onCloseServer,
	onReconnect,
	onWhois,
	onAddFriend,
	onRemoveFriend,
	onBlockUser,
	onUnblockUser,
	isTargetNotified,
	onToggleTargetNotify,
	resolveConnectionStatus,
	resolveDmState,
}) => {
	const [contextMenu, setContextMenu] = useState(null);
	const menuRef = useRef(null);
	const showTargetNotify =
		typeof onToggleTargetNotify === 'function' &&
		typeof isTargetNotified === 'function';

	const closeMenu = () => setContextMenu(null);

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
		const connectionStatus = resolveConnectionStatus
			? resolveConnectionStatus(connectionId)
			: null;
		const isConnected = connectionStatus === 'connected';
		const isConnecting =
			connectionStatus === 'connecting' || connectionStatus === 'authed';
		const canOpenChannelList = Boolean(showChannelList && isConnected);
		const canDisconnectServer = Boolean(
			showDisconnectServer && (isConnected || isConnecting)
		);
		const canReconnectServer = Boolean(
			showReconnectServer && !isConnected && !isConnecting
		);
		const canCloseServer = Boolean(showCloseServer);
		const canChannelNotify = showTargetNotify && targetType === 'channel';
		const canDmNotify = showTargetNotify && targetType === 'dm';
		const hasServerActions =
			targetType === 'server' &&
			(canOpenChannelList ||
				canDisconnectServer ||
				canReconnectServer ||
				canCloseServer);
		const canPartChannel = Boolean(showPart && isConnected);
		const hasChannelActions =
			targetType === 'channel' &&
			(showAutoJoin ||
				canPartChannel ||
				showClearLogs ||
				canChannelNotify);
		const dmState = targetType === 'dm' ? resolveDmState(targetName) : null;
		const canDmMessage = false;
		const canDmWhois =
			targetType === 'dm' && Boolean(onWhois) && isConnected;
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
				canDmClearLogs ||
				canDmNotify);

		if (!hasChannelActions && !hasDmActions && !hasServerActions) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const menuWidth = 200;
		const menuRowHeight = 44;
		const menuHeaderHeight = 36;
		const menuRows =
			targetType === 'server'
				? (canOpenChannelList ? 1 : 0) +
				  (canDisconnectServer ? 1 : 0) +
				  (canReconnectServer ? 1 : 0) +
				  (canCloseServer ? 1 : 0)
				: targetType === 'channel'
				? (canChannelNotify ? 1 : 0) +
				  (canPartChannel ? 1 : 0) +
				  (showClearLogs ? 1 : 0) +
				  (showAutoJoin ? 1 : 0)
				: (canDmMessage ? 1 : 0) +
				  (canDmWhois ? 1 : 0) +
				  (canDmFriend ? 1 : 0) +
				  (canDmBlock ? 1 : 0) +
				  (showCloseDm ? 1 : 0) +
				  (canDmClearLogs ? 1 : 0) +
				  (canDmNotify ? 1 : 0);
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

		const notifyAvailable =
			(showTargetNotify && targetType === 'channel') ||
			(showTargetNotify && targetType === 'dm');
		const notifyEnabled = notifyAvailable
			? Boolean(isTargetNotified(connectionId, targetName))
			: false;

		setContextMenu({
			connectionId,
			targetName,
			targetType,
			autoJoinEnabled,
			notifyAvailable,
			notifyEnabled,
			connectionStatus,
			canOpenChannelList,
			canDisconnectServer,
			canReconnectServer,
			canCloseServer,
			canPartChannel,
			canDmWhois,
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
		if (!contextMenu.canPartChannel) {
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

	const handleOpenChannelList = () => {
		if (!contextMenu || !onOpenChannelList) {
			return;
		}

		if (contextMenu.targetType !== 'server') {
			return;
		}

		if (!contextMenu.canOpenChannelList) {
			return;
		}

		onOpenChannelList(contextMenu.connectionId, {
			sendList: true,
			reset: true,
		});
		closeMenu();
	};

	const handleDisconnect = () => {
		if (!contextMenu || !onDisconnect) {
			return;
		}

		if (contextMenu.targetType !== 'server') {
			return;
		}

		if (!contextMenu.canDisconnectServer) {
			return;
		}

		onDisconnect(contextMenu.connectionId);
		closeMenu();
	};

	const handleCloseServer = () => {
		if (!contextMenu || !onCloseServer) {
			return;
		}

		if (contextMenu.targetType !== 'server') {
			return;
		}

		onCloseServer(contextMenu.connectionId);
		closeMenu();
	};

	const handleReconnect = () => {
		if (!contextMenu || !onReconnect) {
			return;
		}

		if (contextMenu.targetType !== 'server') {
			return;
		}

		if (!contextMenu.canReconnectServer) {
			return;
		}

		onReconnect(contextMenu.connectionId);
		closeMenu();
	};

	const handleToggleTargetNotify = () => {
		if (!contextMenu || !onToggleTargetNotify) {
			return;
		}

		if (contextMenu.targetType !== 'channel' && contextMenu.targetType !== 'dm') {
			return;
		}

		onToggleTargetNotify(
			contextMenu.connectionId,
			contextMenu.targetName,
			!contextMenu.notifyEnabled
		);
		closeMenu();
	};

	return {
		contextMenu,
		menuRef,
		openContextMenu,
		closeMenu,
		handleToggleAutoJoin,
		handlePartChannel,
		handleClearLogs,
		handleOpenChannelList,
		handleDisconnect,
		handleReconnect,
		handleCloseServer,
		handleToggleTargetNotify,
	};
};

export { useConnectionsContextMenu };
