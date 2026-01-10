import { STATUS_TARGET } from '../../irc/state.js';

const statusMeta = {
	connecting: {
		label: 'Connecting',
		className:
			'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
		dotClass: 'bg-amber-500',
	},
	authed: {
		label: 'Connecting',
		className:
			'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
		dotClass: 'bg-amber-500',
	},
	closed: {
		label: 'Disconnected',
		className:
			'text-neutral-600 bg-neutral-100 dark:text-neutral-300 dark:bg-neutral-800',
		dotClass: 'bg-neutral-400',
	},
	idle: {
		label: 'Disconnected',
		className:
			'text-neutral-600 bg-neutral-100 dark:text-neutral-300 dark:bg-neutral-800',
		dotClass: 'bg-neutral-400',
	},
	error: {
		label: 'Error',
		className:
			'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
		dotClass: 'bg-red-500',
	},
};

const ChatHeader = ({ activeTarget, chatState }) => {
	const statusInfo = statusMeta[chatState.status] || null;

	return (
		<div className="border-b border-neutral-200 px-4 py-3 bg-white dark:bg-neutral-900 dark:border-neutral-800">
			<div className="flex items-center justify-between">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-semibold text-neutral-900 truncate dark:text-white">
							{activeTarget.name === STATUS_TARGET
								? 'Server Status'
								: activeTarget.name}
						</h2>
						{chatState.me && (
							<span
								className="text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded px-1.5 py-0.5 dark:text-neutral-400 dark:bg-neutral-800"
								title="Current connection nick"
							>
								Nick: {chatState.me}
							</span>
						)}
						{activeTarget.name === STATUS_TARGET && (
							<span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded px-1.5 py-0.5 dark:text-neutral-400 dark:bg-neutral-800">
								Server
							</span>
						)}
						{activeTarget.type === 'dm' && (
							<span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded px-1.5 py-0.5 dark:text-neutral-400 dark:bg-neutral-800">
								DM
							</span>
						)}
					</div>
					{activeTarget.topic && (
						<p className="mt-0.5 text-xs text-neutral-500 break-words dark:text-neutral-400">
							{activeTarget.topic}
						</p>
					)}
				</div>
				{statusInfo && (
					<div
						className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${statusInfo.className}`}
					>
						<span
							className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass} ${
								chatState.status === 'connecting' ||
								chatState.status === 'authed'
									? 'animate-pulse'
									: ''
							}`}
						/>
						{statusInfo.label}
					</div>
				)}
			</div>
		</div>
	);
};

export { ChatHeader };
