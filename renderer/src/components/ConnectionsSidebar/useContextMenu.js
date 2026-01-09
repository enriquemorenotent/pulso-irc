import { useEffect, useRef, useState } from 'react';

const useConnectionsContextMenu = ({
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
}) => {
	const [contextMenu, setContextMenu] = useState(null);
	const menuRef = useRef(null);

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
		const hasServerActions = targetType === 'server' && showChannelList;
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
				? showChannelList
					? 1
					: 0
				: targetType === 'channel'
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

	const handleOpenChannelList = () => {
		if (!contextMenu || !onOpenChannelList) {
			return;
		}

		if (contextMenu.targetType !== 'server') {
			return;
		}

		onOpenChannelList(contextMenu.connectionId, {
			sendList: true,
			reset: true,
		});
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
	};
};

export { useConnectionsContextMenu };
