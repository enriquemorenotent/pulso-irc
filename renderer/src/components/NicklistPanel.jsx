import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { getNickColorClasses } from '../irc/formatting.js';
import { RoleBadge } from './RoleBadge.jsx';
import { NickContextMenu } from './NickContextMenu.jsx';

const NicklistPanel = ({
	activeUsers,
	activeTarget,
	chatState,
	onOpenDm,
	onWhois,
	isFriend,
	isBlocked,
	onAddFriend,
	onRemoveFriend,
	onBlockUser,
	onUnblockUser,
}) => {
	const [contextMenu, setContextMenu] = useState(null);

	const handleContextMenu = useCallback((e, nick) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			nick,
		});
	}, []);

	const closeContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	const isStale =
		activeTarget?.type === 'channel' &&
		!activeTarget?.namesReceived &&
		chatState?.status !== 'connected';

	return (
		<aside className="h-full w-56 flex-shrink-0 border-l border-neutral-200 bg-white flex flex-col dark:bg-neutral-900 dark:border-neutral-800">
			<div className="h-12 px-4 flex items-center justify-between border-b border-neutral-200/50 bg-neutral-50/50 dark:bg-neutral-900/50 dark:border-neutral-800">
				<span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 select-none dark:text-neutral-500">
					Users
				</span>
				<span className="text-[10px] font-medium text-neutral-500 bg-neutral-200/60 rounded-full px-2 py-0.5 dark:text-neutral-400 dark:bg-neutral-700">
					{activeUsers.length}
				</span>
			</div>
			{isStale && activeUsers.length > 0 && (
				<div className="mx-2 mt-2 px-2 py-1.5 rounded bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50">
					<p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
						⚠️ Reconnecting - user list may be outdated
					</p>
				</div>
			)}
			<div className="flex-1 overflow-y-auto w-full">
				{activeUsers.length ? (
					<div className="flex flex-col">
						{activeUsers.map(([nick, prefix]) => {
							const nickIsFriend = isFriend && isFriend(nick);
							const nickIsBlocked = isBlocked && isBlocked(nick);
							const nickColor = getNickColorClasses(nick);
							const nickColorClass =
								!nickIsBlocked && nickColor
									? nickColor.text
									: '';
							return (
								<div
									key={nick}
									onDoubleClick={() =>
										onOpenDm && onOpenDm(nick)
									}
									onContextMenu={(e) =>
										handleContextMenu(e, nick)
									}
									className={`flex items-center justify-between gap-3 px-4 py-1.5 hover:bg-neutral-50 hover:text-neutral-900 text-sm cursor-pointer transition-colors dark:hover:bg-neutral-900/30 dark:hover:text-neutral-300 ${
										nickIsBlocked
											? 'text-neutral-400 dark:text-neutral-600 line-through'
											: 'text-neutral-700 dark:text-neutral-300'
									}`}
									title="Double-click to message, right-click for options"
								>
									<div className="flex items-center gap-2 min-w-0">
										<span
											className={`truncate font-semibold ${nickColorClass}`}
										>
											{nick}
										</span>
										{nickIsFriend && !nickIsBlocked && (
											<Star
												className="w-3 h-3 text-amber-400 flex-shrink-0"
												fill="currentColor"
											/>
										)}
									</div>
									{prefix && (
										<div
											className={`flex items-center gap-1 ${
												nickIsBlocked
													? 'opacity-50'
													: ''
											}`}
										>
											<RoleBadge prefix={prefix} />
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<div className="p-6 text-center">
						<p className="text-xs text-neutral-400 dark:text-neutral-500">
							No users in channel
						</p>
					</div>
				)}
			</div>

			{contextMenu && (
				<NickContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					nick={contextMenu.nick}
					isFriend={isFriend && isFriend(contextMenu.nick)}
					isBlocked={isBlocked && isBlocked(contextMenu.nick)}
					onClose={closeContextMenu}
					onOpenDm={onOpenDm}
					onWhois={onWhois}
					onAddFriend={onAddFriend}
					onRemoveFriend={onRemoveFriend}
					onBlockUser={onBlockUser}
					onUnblockUser={onUnblockUser}
				/>
			)}
		</aside>
	);
};

export { NicklistPanel };
