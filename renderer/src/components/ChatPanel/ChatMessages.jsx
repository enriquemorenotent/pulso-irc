import { useLayoutEffect, useMemo, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MessageRow } from '../MessageRow.jsx';
import { useVirtualList } from './useVirtualList.js';

const ESTIMATED_MESSAGE_HEIGHT = 28;
const ESTIMATED_DIVIDER_HEIGHT = 20;

const UnreadDivider = () => (
	<div className="px-4 py-2">
		<div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
			<span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
			<span>New messages</span>
			<span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
		</div>
	</div>
);

const VirtualRow = ({ itemKey, start, onSize, children }) => {
	const rowRef = useRef(null);
	useLayoutEffect(() => {
		const el = rowRef.current;
		if (!el) {
			return undefined;
		}

		const handleMeasure = () => {
			const nextHeight = el.getBoundingClientRect().height;
			if (nextHeight) {
				onSize(itemKey, nextHeight);
			}
		};

		handleMeasure();

		let observer;
		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(handleMeasure);
			observer.observe(el);
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	}, [itemKey, onSize]);

	return (
		<div
			ref={rowRef}
			style={{ position: 'absolute', top: start, left: 0, right: 0 }}
		>
			{children}
		</div>
	);
};

const MessageListBody = ({
	items,
	onChannelClick,
	onNickContextMenu,
	onNickDoubleClick,
	onImageLoad,
	currentNick,
	showMediaPreviews,
	scrollRef,
}) => {
	const { virtualItems, totalHeight, setSize } = useVirtualList({
		items,
		getItemKey: (item) => item.key,
		estimateSize: (item) =>
			item.type === 'divider'
				? ESTIMATED_DIVIDER_HEIGHT
				: ESTIMATED_MESSAGE_HEIGHT,
		overScan: 10,
		scrollRef,
	});

	return (
		<div style={{ position: 'relative', height: totalHeight }}>
			{virtualItems.map(({ key, start, item }) => (
				<VirtualRow key={key} itemKey={key} start={start} onSize={setSize}>
					{item.type === 'divider' ? (
						<UnreadDivider />
					) : (
						<MessageRow
							message={item.message}
							onChannelClick={onChannelClick}
							onNickContextMenu={onNickContextMenu}
							onNickDoubleClick={onNickDoubleClick}
							onImageLoad={onImageLoad}
							currentNick={currentNick}
							showMediaPreviews={showMediaPreviews}
						/>
					)}
				</VirtualRow>
			))}
		</div>
	);
};

const ChatMessages = ({
	scrollRef,
	onScroll,
	activeTarget,
	chatState,
	showJoinPrompt,
	onChannelClick,
	onNickContextMenu,
	onNickDoubleClick,
	onImageLoad,
	showMediaPreviews,
	lastReadIndex,
	showUnreadDivider,
}) => {
	const items = useMemo(() => {
		const messageItems = [];
		const messages = activeTarget.messages || [];
		messages.forEach((message, index) => {
			messageItems.push({
				type: 'message',
				key: message.id,
				message,
			});
			if (showUnreadDivider && index === lastReadIndex) {
				messageItems.push({
					type: 'divider',
					key: `divider-${message.id}`,
				});
			}
		});
		return messageItems;
	}, [activeTarget.messages, lastReadIndex, showUnreadDivider]);

	const listKey = `${chatState.server || chatState.me || 'irc'}:${activeTarget.name}`;

	return (
		<div
			ref={scrollRef}
			onScroll={onScroll}
			className="flex-1 overflow-y-auto px-0 py-0 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
		>
			{activeTarget.type === 'channel' &&
				!activeTarget.namesReceived &&
				chatState.status === 'connected' && (
					<div className="m-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-200">
						<p className="font-semibold flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							Loading user list...
						</p>
						<p className="mt-1 text-amber-700 dark:text-amber-300">
							User list will update once received from server.
						</p>
					</div>
				)}
			{showJoinPrompt && (
				<div className="m-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-200">
					<p className="font-semibold">
						Connected to {chatState.server}
					</p>
					<p className="mt-1 text-blue-700 dark:text-blue-300">
						Use{' '}
						<code className="bg-blue-100 rounded px-1 py-0.5 text-blue-900 font-mono dark:bg-blue-900/50 dark:text-blue-100">
							/join #channel
						</code>{' '}
						to start chatting.
					</p>
				</div>
			)}

			<div className="flex flex-col py-2">
				{items.length ? (
					<MessageListBody
						key={listKey}
						items={items}
						onChannelClick={onChannelClick}
						onNickContextMenu={onNickContextMenu}
						onNickDoubleClick={onNickDoubleClick}
						onImageLoad={onImageLoad}
						currentNick={chatState.me}
						showMediaPreviews={showMediaPreviews}
						scrollRef={scrollRef}
					/>
				) : (
					!showJoinPrompt && (
						<div className="p-8 text-center text-neutral-400 dark:text-neutral-600">
							<p className="text-sm">No messages yet.</p>
						</div>
					)
				)}
			</div>
		</div>
	);
};

export { ChatMessages };
