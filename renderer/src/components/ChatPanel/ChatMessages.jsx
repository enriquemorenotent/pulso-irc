import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MessageRow } from '../MessageRow.jsx';

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
}) => (
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
				<p className="font-semibold">Connected to {chatState.server}</p>
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
			{activeTarget.messages.length
				? activeTarget.messages.map((message, index) => (
						<Fragment key={message.id}>
							<MessageRow
								message={message}
								onChannelClick={onChannelClick}
								onNickContextMenu={onNickContextMenu}
								onNickDoubleClick={onNickDoubleClick}
								onImageLoad={onImageLoad}
								currentNick={chatState.me}
								showMediaPreviews={showMediaPreviews}
							/>
							{showUnreadDivider && index === lastReadIndex && (
								<div className="px-4 py-2">
									<div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
										<span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
										<span>New messages</span>
										<span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
									</div>
								</div>
							)}
						</Fragment>
					))
				: !showJoinPrompt && (
						<div className="p-8 text-center text-neutral-400 dark:text-neutral-600">
							<p className="text-sm">No messages yet.</p>
						</div>
					)}
		</div>
	</div>
);

export { ChatMessages };
