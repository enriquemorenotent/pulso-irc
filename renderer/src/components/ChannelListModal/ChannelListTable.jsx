import { ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatUserCount } from './helpers.js';

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

const ChannelListTable = ({
	sorted,
	status,
	sortKey,
	sortDirection,
	onSort,
	joinedChannels,
	onJoin,
}) => {
	const listRef = useRef(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);

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
	const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
	const endIndex = Math.min(totalRows, startIndex + visibleCount);
	const visibleItems = sorted.slice(startIndex, endIndex);
	const offsetY = startIndex * ROW_HEIGHT;
	const totalHeight = totalRows * ROW_HEIGHT;

	const renderSortIcon = (key) => (
		<SortIcon
			active={sortKey === key}
			direction={sortKey === key ? sortDirection : 'asc'}
		/>
	);

	return (
		<div className="mt-4 border border-neutral-200 rounded-xl overflow-hidden dark:border-neutral-800">
			<div className="grid grid-cols-[minmax(0,1fr)_100px_120px] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-500">
				<button
					type="button"
					onClick={() => onSort('name')}
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
					onClick={() => onSort('users')}
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
						<div style={{ transform: `translateY(${offsetY}px)` }}>
							{visibleItems.map((item) => {
								const channel = item.channel;
								const lowerChannel = String(channel || '').toLowerCase();
								const isJoined =
									joinedChannels && joinedChannels.has(lowerChannel);
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
												onClick={() => onJoin && onJoin(channel)}
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
	);
};

export { ChannelListTable };
