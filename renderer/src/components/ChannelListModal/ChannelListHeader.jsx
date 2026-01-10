import { RefreshCw } from 'lucide-react';

const ChannelListHeader = ({ statusLabel, total, onRefresh, canRefresh }) => (
	<div className="flex flex-wrap items-center justify-between gap-3">
		<div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
			<div>
				Status: <span className="font-semibold">{statusLabel}</span>
			</div>
			<div>
				Channels: <span className="font-semibold">{total}</span>
			</div>
		</div>
		<button
			type="button"
			onClick={() => onRefresh && onRefresh()}
			disabled={canRefresh === false}
			title={canRefresh === false ? 'Connect to refresh the list' : undefined}
			className={`inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 ${
				canRefresh === false
					? 'opacity-50 cursor-not-allowed'
					: 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
			}`}
		>
			<RefreshCw className="w-3.5 h-3.5" />
			Refresh list
		</button>
	</div>
);

export { ChannelListHeader };
