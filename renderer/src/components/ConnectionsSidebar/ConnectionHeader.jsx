import { AlertCircle, Power, RefreshCw, Server } from 'lucide-react';

const ConnectionHeader = ({
	connection,
	isStatusActive,
	statusTarget,
	statusInfo,
	onSelect,
	onTargetContextMenu,
	showAction,
	actionType,
	onAction,
}) => (
	<div className="px-2 mb-1">
		<button
			type="button"
			onClick={() => onSelect(connection.id, statusTarget)}
			onContextMenu={(event) => {
				if (!onTargetContextMenu) {
					return;
				}
				onTargetContextMenu(
					event,
					connection.id,
					statusTarget,
					'server',
					false
				);
			}}
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
						<AlertCircle
							className={`w-3.5 h-3.5 ${statusInfo.color}`}
						/>
					) : (
						<Server className="w-3.5 h-3.5" />
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

			{showAction && (
				<div
					role="button"
					onClick={(event) => {
						event.stopPropagation();
						onAction();
					}}
					className={`opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 dark:text-neutral-500 transition-all cursor-pointer ${
						actionType === 'disconnect'
							? 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
							: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400'
					}`}
					title={actionType === 'disconnect' ? 'Disconnect' : 'Reconnect'}
				>
					{actionType === 'disconnect' ? (
						<Power className="w-3 h-3" />
					) : (
						<RefreshCw className="w-3 h-3" />
					)}
				</div>
			)}
		</button>
	</div>
);

export { ConnectionHeader };
