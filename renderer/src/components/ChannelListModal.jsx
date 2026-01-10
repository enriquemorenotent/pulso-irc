import { useState } from 'react';
import { ChannelListHeader } from './ChannelListModal/ChannelListHeader.jsx';
import { ChannelListSearch } from './ChannelListModal/ChannelListSearch.jsx';
import { ChannelListTable } from './ChannelListModal/ChannelListTable.jsx';
import { sortChannels } from './ChannelListModal/helpers.js';

const ChannelListModal = ({
	listState,
	onJoin,
	joinedChannels,
	onRefresh,
	canJoin,
	canRefresh,
}) => {
	const [query, setQuery] = useState('');
	const [sortKey, setSortKey] = useState('name');
	const [sortDirection, setSortDirection] = useState('asc');
	const items = Array.isArray(listState?.items) ? listState.items : [];
	const status = listState?.status || 'idle';
	const total =
		typeof listState?.total === 'number' ? listState.total : items.length;
	const truncated = Boolean(listState?.truncated);
	const error = listState?.error || '';

	const normalizedQuery = query.trim().toLowerCase();
	const filtered = !normalizedQuery
		? items
		: items.filter((item) => {
			const channel = String(item.channel || '').toLowerCase();
			const topic = String(item.topic || '').toLowerCase();
			return (
				channel.includes(normalizedQuery) ||
				topic.includes(normalizedQuery)
			);
		});

	const sorted = sortChannels(filtered, sortKey, sortDirection);

	const handleSort = (key) => {
		if (sortKey === key) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			return;
		}
		setSortKey(key);
		setSortDirection(key === 'users' ? 'desc' : 'asc');
	};

	const statusLabel =
		status === 'error'
			? 'Error'
			: status === 'loading'
			? 'Loading'
			: status === 'complete'
			? 'Complete'
			: 'Idle';

	return (
		<div className="p-6">
			<ChannelListHeader
				statusLabel={statusLabel}
				total={total}
				onRefresh={onRefresh}
				canRefresh={canRefresh}
			/>

			{error && (
				<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
					{error}
				</div>
			)}

			<ChannelListSearch query={query} onChange={setQuery} />

			<ChannelListTable
				sorted={sorted}
				status={status}
				sortKey={sortKey}
				sortDirection={sortDirection}
				onSort={handleSort}
				joinedChannels={joinedChannels}
				onJoin={onJoin}
				canJoin={canJoin}
			/>

			{truncated && (
				<p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
					List truncated for performance.
				</p>
			)}
		</div>
	);
};

export { ChannelListModal };
