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
	containerRef,
}) => {
	const menuRef = useRef(null);
	const showCloseDm = typeof onCloseDm === 'function';
	const canMessage = showMessage && typeof onOpenDm === 'function';
	const showClearLogs = typeof onClearLogs === 'function';
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
					<svg
						className="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
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
					<svg
						className="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
						/>
					</svg>
					Whois
				</button>
			)}

			{isFriend ? (
				<>
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
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
							/>
						</svg>
						{isBlocked ? 'Unblock User' : 'Block User'}
					</button>
					<button
						type="button"
						onClick={() => {
							onRemoveFriend(nick);
							onClose();
						}}
						className={`${menuItemClass} text-red-600 dark:text-red-400`}
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
							/>
						</svg>
						Remove Friend
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
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
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
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
							/>
						</svg>
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
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
								/>
							</svg>
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
							<svg
								className="w-4 h-4"
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
							Close DM
						</button>
					)}
				</>
			)}
		</div>
	);
};

export { NickContextMenu };
