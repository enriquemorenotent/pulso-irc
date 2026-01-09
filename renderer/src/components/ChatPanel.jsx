import { AlertTriangle, Send } from 'lucide-react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { STATUS_TARGET } from '../irc/state.js';
import { MessageRow } from './MessageRow.jsx';
import { NickContextMenu } from './NickContextMenu.jsx';
import { useIrcCommands } from '../hooks/useIrcCommands.js';

const MessageComposer = ({
	activeTarget,
	chatState,
	effectiveSettings,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	nicknames,
	onOpenDm,
	onOpenList,
}) => {
	const inputRef = useRef(null);
	const {
		messageInput,
		setMessageInput,
		handleSend,
		handleInputKeyDown,
		handleInputChange,
	} = useIrcCommands({
		chatState,
		effectiveSettings,
		sendMessage,
		addStatusNote,
		addOutgoingMessage,
		supportsEcho,
		nicknames,
		onOpenDm,
		onOpenList,
	});

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [activeTarget.name]);

	return (
		<div className="border-t border-neutral-200 p-3 bg-neutral-50/80 dark:bg-neutral-900/80 dark:border-neutral-800">
			<div className="relative flex gap-2">
				<input
					ref={inputRef}
					className="flex-1 min-w-0 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:ring-neutral-700 dark:focus:border-neutral-600"
					value={messageInput}
					onChange={(event) => {
						if (handleInputChange) {
							handleInputChange(event);
							return;
						}
						setMessageInput(event.target.value);
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							handleSend();
							return;
						}
						if (handleInputKeyDown) {
							handleInputKeyDown(event);
						}
					}}
					placeholder={
						chatState.active === STATUS_TARGET
							? 'Type /join #channel...'
							: `Message ${activeTarget.name}...`
					}
					autoFocus
				/>
				<button
					type="button"
					onClick={handleSend}
					disabled={!messageInput.trim()}
					className="rounded-lg bg-neutral-800 p-2.5 text-white hover:bg-neutral-700 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-500 dark:bg-neutral-600 dark:hover:bg-neutral-500"
					aria-label="Send message"
				>
					<Send className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

const ChatPanel = ({
	activeTarget,
	chatState,
	showJoinPrompt,
	onChannelClick,
	onOpenDm,
	onWhois,
	isFriend,
	isBlocked,
	onAddFriend,
	onRemoveFriend,
	onBlockUser,
	onUnblockUser,
	effectiveSettings,
	showMediaPreviews,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	nicknames,
	onOpenChannelList,
}) => {
	const scrollRef = useRef(null);
	const isNearBottomRef = useRef(true);
	const [contextMenu, setContextMenu] = useState(null);

	const checkIfNearBottom = () => {
		const el = scrollRef.current;
		if (!el) return true;
		const threshold = 100;
		return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
	};

	const scrollToBottom = () => {
		const el = scrollRef.current;
		if (el) {
			el.scrollTop = el.scrollHeight;
		}
	};

	useEffect(() => {
		if (isNearBottomRef.current) {
			scrollToBottom();
		}
	}, [activeTarget.messages.length, activeTarget.name]);

	// Handle image loads - if we're near bottom, scroll to maintain position
	const handleImageLoad = useCallback(() => {
		if (isNearBottomRef.current) {
			scrollToBottom();
		}
	}, []);

	const handleScroll = () => {
		isNearBottomRef.current = checkIfNearBottom();
	};

	const handleNickContextMenu = useCallback((event, nick) => {
		if (!nick) {
			return;
		}
		event.preventDefault();
		setContextMenu({
			x: event.clientX,
			y: event.clientY,
			nick,
		});
	}, []);

	const handleNickDoubleClick = useCallback(
		(nick) => {
			if (!onOpenDm || !nick) {
				return;
			}
			onOpenDm(nick);
		},
		[onOpenDm]
	);

	const closeContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	const lastReadId = activeTarget.lastReadId;
	const lastReadIndex =
		lastReadId &&
		activeTarget.messages.findIndex((message) => message.id === lastReadId);
	const showUnreadDivider =
		typeof lastReadIndex === 'number' &&
		lastReadIndex >= 0 &&
		lastReadIndex < activeTarget.messages.length - 1;

	return (
		<section className="flex flex-col flex-1 min-w-0 bg-white dark:bg-neutral-950">
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
			{!chatState.server && (
						<div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded dark:text-amber-400 dark:bg-amber-900/30">
							<span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
							Disconnected
						</div>
					)}
				</div>
			</div>

			<div
				ref={scrollRef}
				onScroll={handleScroll}
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
					{activeTarget.messages.length
						? activeTarget.messages.map((message, index) => (
								<Fragment key={message.id}>
									<MessageRow
										message={message}
										onChannelClick={onChannelClick}
										onNickContextMenu={
											handleNickContextMenu
										}
										onNickDoubleClick={
											handleNickDoubleClick
										}
										onImageLoad={handleImageLoad}
										currentNick={chatState.me}
										showMediaPreviews={showMediaPreviews}
									/>
									{showUnreadDivider &&
										index === lastReadIndex && (
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

			{contextMenu && (
				<NickContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					nick={contextMenu.nick}
					isFriend={isFriend ? isFriend(contextMenu.nick) : false}
					isBlocked={isBlocked ? isBlocked(contextMenu.nick) : false}
					onClose={closeContextMenu}
					onOpenDm={onOpenDm}
					onWhois={onWhois}
					onAddFriend={onAddFriend}
					onRemoveFriend={onRemoveFriend}
					onBlockUser={onBlockUser}
					onUnblockUser={onUnblockUser}
				/>
			)}

			<MessageComposer
				activeTarget={activeTarget}
				chatState={chatState}
				effectiveSettings={effectiveSettings}
				sendMessage={sendMessage}
				addStatusNote={addStatusNote}
				addOutgoingMessage={addOutgoingMessage}
				supportsEcho={supportsEcho}
				nicknames={nicknames}
				onOpenDm={onOpenDm}
				onOpenList={onOpenChannelList}
			/>
		</section>
	);
};

export { ChatPanel };
