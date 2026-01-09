import { ChevronUp, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { inputClass } from '../ui/classes.js';

const ROW_HEIGHT = 64;
const OVERSCAN = 6;

const SortIcon = ({ active, direction }) => (
	<ChevronUp
		className={`w-3 h-3 ${
			active
				? 'text-neutral-500 dark:text-neutral-400'
				: 'text-neutral-300 dark:text-neutral-600'
		} ${direction === 'desc' ? 'rotate-180' : ''}`}
		aria-hidden="true"
	/>
);

const formatUserCount = (count) => {
	if (typeof count !== 'number' || Number.isNaN(count)) {
		return 'n/a';
	}
	return count.toLocaleString();
};

const ChannelListModal = ({
	listState,
	onJoin,
	joinedChannels,
	onRefresh,
}) => {
	const [query, setQuery] = useState('');
	const [sortKey, setSortKey] = useState('name');
	const [sortDirection, setSortDirection] = useState('asc');
	const listRef = useRef(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
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

	const compareNames = (a, b) => {
		const nameA = String(a.channel || '').toLowerCase();
		const nameB = String(b.channel || '').toLowerCase();
		return nameA.localeCompare(nameB);
	};

	const getUserCountValue = (item) => {
		const value = item?.users;
		if (typeof value !== 'number' || Number.isNaN(value)) {
			return null;
		}
		return value;
	};

	const sorted = filtered.slice().sort((a, b) => {
		if (sortKey === 'users') {
			const countA = getUserCountValue(a);
			const countB = getUserCountValue(b);
			if (countA === null && countB === null) {
				return compareNames(a, b);
			}
			if (countA === null) {
				return 1;
			}
			if (countB === null) {
				return -1;
			}
			const diff = countA - countB;
			if (diff !== 0) {
				return sortDirection === 'asc' ? diff : -diff;
			}
			return compareNames(a, b);
		}

		const diff = compareNames(a, b);
		return sortDirection === 'asc' ? diff : -diff;
	});

	const resetScroll = () => {
		if (listRef.current) {
			listRef.current.scrollTop = 0;
		}
		setScrollTop(0);
	};

	const handleSort = (key) => {
		if (sortKey === key) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			resetScroll();
			return;
		}
		setSortKey(key);
		setSortDirection(key === 'users' ? 'desc' : 'asc');
		resetScroll();
	};

	const renderSortIcon = (key) => (
		<SortIcon
			active={sortKey === key}
			direction={sortKey === key ? sortDirection : 'asc'}
		/>
	);

	useEffect(() => {
		if (!listRef.current) {
			return;
		}
		const updateHeight = () => {
			if (listRef.current) {
				setViewportHeight(listRef.current.clientHeight);
			}
		};
		updateHeight();
		if (typeof ResizeObserver === 'undefined') {
			if (typeof window !== 'undefined') {
				window.addEventListener('resize', updateHeight);
				return () => window.removeEventListener('resize', updateHeight);
			}
			return;
		}
		const observer = new ResizeObserver(updateHeight);
		observer.observe(listRef.current);
		return () => observer.disconnect();
	}, []);

	const totalRows = sorted.length;
	const baseVisibleCount = viewportHeight
		? Math.ceil(viewportHeight / ROW_HEIGHT)
		: 12;
	const visibleCount = baseVisibleCount + OVERSCAN * 2;
	const startIndex = Math.max(
		0,
		Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN
	);
	const endIndex = Math.min(totalRows, startIndex + visibleCount);
	const visibleItems = sorted.slice(startIndex, endIndex);
	const offsetY = startIndex * ROW_HEIGHT;
	const totalHeight = totalRows * ROW_HEIGHT;

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
					className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
				>
					<RefreshCw className="w-3.5 h-3.5" />
					Refresh list
				</button>
			</div>

			{error && (
				<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
					{error}
				</div>
			)}

			<div className="mt-4">
				<input
					className={inputClass}
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						resetScroll();
					}}
					placeholder="Filter channels or topics..."
				/>
			</div>

			<div className="mt-4 border border-neutral-200 rounded-xl overflow-hidden dark:border-neutral-800">
				<div className="grid grid-cols-[minmax(0,1fr)_100px_120px] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-500">
					<button
						type="button"
						onClick={() => handleSort('name')}
						className="text-left inline-flex items-center gap-2"
						title="Sort by channel name"
						aria-sort={
							sortKey === 'name'
								? sortDirection === 'asc'
									? 'ascending'
									: 'descending'
								: 'none'
						}
					>
						Channel
						{renderSortIcon('name')}
					</button>
					<button
						type="button"
						onClick={() => handleSort('users')}
						className="text-right inline-flex items-center justify-end gap-2"
						title="Sort by users"
						aria-sort={
							sortKey === 'users'
								? sortDirection === 'asc'
									? 'ascending'
									: 'descending'
								: 'none'
						}
					>
						Users
						{renderSortIcon('users')}
					</button>
					<span className="text-right">Action</span>
				</div>
				<div
					ref={listRef}
					onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
					className="h-[60vh] overflow-y-auto"
				>
					{sorted.length ? (
						<div style={{ height: totalHeight, position: 'relative' }}>
							<div
								style={{
									transform: `translateY(${offsetY}px)`,
								}}
							>
								{visibleItems.map((item) => {
									const channel = item.channel;
									const lowerChannel = String(channel || '').toLowerCase();
									const isJoined =
										joinedChannels &&
										joinedChannels.has(lowerChannel);
									return (
										<div
											key={channel}
											className="grid grid-cols-[minmax(0,1fr)_100px_120px] gap-3 px-4 text-sm border-t border-neutral-100 dark:border-neutral-800 h-16 items-center"
										>
											<div className="min-w-0 flex flex-col justify-center">
												<p className="font-semibold text-neutral-900 truncate dark:text-neutral-100">
													{channel}
												</p>
												<p className="text-xs text-neutral-500 truncate dark:text-neutral-400 h-4">
													{item.topic || ''}
												</p>
											</div>
											<p className="text-right text-neutral-600 dark:text-neutral-400">
												{formatUserCount(item.users)}
											</p>
											<div className="text-right">
												<button
													type="button"
													onClick={() =>
														onJoin && onJoin(channel)
													}
													disabled={!channel || isJoined}
													className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
														isJoined
															? 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed'
															: 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400'
													}`}
												>
													{isJoined ? 'Joined' : 'Join'}
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					) : (
						<div className="px-6 py-10 text-center text-sm text-neutral-400 dark:text-neutral-600">
							{status === 'loading'
								? 'Waiting for channel list...'
								: 'No channels to display.'}
						</div>
					)}
				</div>
			</div>

			{truncated && (
				<p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
					List truncated for performance.
				</p>
			)}
		</div>
	);
};

export { ChannelListModal };
