import { Hash, User, X } from 'lucide-react';
import { isAutoJoinEnabled } from '../../irc/auto_join.js';
import { isChannelName, sortTargets } from './helpers.js';

const ConnectionTargets = ({
	connection,
	isActive,
	statusTarget,
	onSelect,
	onTargetContextMenu,
	friendNickSet,
	onCloseDm,
	onlineNicksByConnection,
}) => {
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

	const isDmOnline = (nick) => {
		if (!nick || !onlineNicksByConnection) {
			return false;
		}
		const lowerNick = nick.toLowerCase();
		const connectionSet = onlineNicksByConnection.get(lowerNick);
		return Boolean(connectionSet && connectionSet.has(connection.id));
	};

	return (
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
								<Hash
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
								<User
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
									<X className="w-3 h-3" />
								</button>
							)}
						</div>
					</button>
				);
			})}
		</div>
	);
};

export { ConnectionTargets };
