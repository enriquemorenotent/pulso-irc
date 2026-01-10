import {
	Bell,
	BellOff,
	Ban,
	Info,
	MessageCircle,
	Trash2,
	UserMinus,
	UserPlus,
	X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const NickContextMenu = ({
	x,
	y,
	nick,
	isFriend,
	isBlocked,
	onClose,
	onOpenDm,
	showMessage = true,
	onWhois,
	onAddFriend,
	onRemoveFriend,
	onBlockUser,
	onUnblockUser,
	onCloseDm,
	onClearLogs,
	notifyEnabled,
	onToggleNotify,
	containerRef,
}) => {
	const menuRef = useRef(null);
	const showCloseDm = typeof onCloseDm === 'function';
	const canMessage = showMessage && typeof onOpenDm === 'function';
	const showClearLogs = typeof onClearLogs === 'function';
	const showNotifyToggle = typeof onToggleNotify === 'function';
	const showFooterActions = showCloseDm || showClearLogs;
	const setMenuRefs = (node) => {
		menuRef.current = node;
		if (containerRef && typeof containerRef === 'object') {
			containerRef.current = node;
		}
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				onClose();
			}
		};
		const handleEscape = (event) => {
			if (event.key === 'Escape') onClose();
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [onClose]);

	const style = {
		position: 'fixed',
		left: x,
		top: y,
		zIndex: 100,
	};

	const menuItemClass =
		'w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center gap-2 transition-colors';

	return (
		<div
			ref={setMenuRefs}
			style={style}
			className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 min-w-[160px] animate-scale-in"
		>
			<div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700">
				<p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
					{nick}
				</p>
			</div>

			{canMessage && (
				<button
					type="button"
					onClick={() => {
						onOpenDm(nick);
						onClose();
					}}
					className={menuItemClass}
				>
					<MessageCircle className="w-4 h-4" />
					Send Message
				</button>
			)}

			{onWhois && (
				<button
					type="button"
					onClick={() => {
						onWhois(nick);
						onClose();
					}}
					className={menuItemClass}
				>
					<Info className="w-4 h-4" />
					Whois
				</button>
			)}

			{showNotifyToggle && (
				<button
					type="button"
					onClick={() => {
						onToggleNotify();
						onClose();
					}}
					className={menuItemClass}
				>
					{notifyEnabled ? (
						<BellOff className="w-4 h-4" />
					) : (
						<Bell className="w-4 h-4" />
					)}
					{notifyEnabled ? 'Disable beep' : 'Enable beep'}
				</button>
			)}

			{isFriend ? (
				<>
					<button
						type="button"
						onClick={() => {
							onRemoveFriend(nick);
							onClose();
						}}
						className={`${menuItemClass} text-red-600 dark:text-red-400`}
					>
						<UserMinus className="w-4 h-4" />
						Remove Friend
					</button>
					<button
						type="button"
						onClick={() => {
							isBlocked ? onUnblockUser(nick) : onBlockUser(nick);
							onClose();
						}}
						className={`${menuItemClass} ${
							isBlocked
								? 'text-green-600 dark:text-green-400'
								: 'text-red-600 dark:text-red-400'
						}`}
					>
						<Ban className="w-4 h-4" />
						{isBlocked ? 'Unblock User' : 'Block User'}
					</button>
				</>
			) : (
				<>
					<button
						type="button"
						onClick={() => {
							onAddFriend(nick);
							onClose();
						}}
						className={`${menuItemClass} text-blue-600 dark:text-blue-400`}
					>
						<UserPlus className="w-4 h-4" />
						Add Friend
					</button>
					<button
						type="button"
						onClick={() => {
							isBlocked ? onUnblockUser(nick) : onBlockUser(nick);
							onClose();
						}}
						className={`${menuItemClass} ${
							isBlocked
								? 'text-green-600 dark:text-green-400'
								: 'text-red-600 dark:text-red-400'
						}`}
					>
						<Ban className="w-4 h-4" />
						{isBlocked ? 'Unblock User' : 'Block User'}
					</button>
				</>
			)}

			{showFooterActions && (
				<>
					<div className="my-1 h-px bg-neutral-100 dark:bg-neutral-700" />
					{showClearLogs && (
						<button
							type="button"
							onClick={() => {
							onClearLogs(nick);
							onClose();
						}}
						className={`${menuItemClass} text-red-600 dark:text-red-400`}
					>
						<Trash2 className="w-4 h-4" />
						Clear logs
					</button>
				)}
					{showCloseDm && (
						<button
							type="button"
							onClick={() => {
								onCloseDm();
							onClose();
						}}
						className={menuItemClass}
					>
						<X className="w-4 h-4" />
						Close DM
					</button>
				)}
				</>
			)}
		</div>
	);
};

export { NickContextMenu };
