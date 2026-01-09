import { useCallback } from 'react';
import { NickContextMenu } from './NickContextMenu.jsx';
import { MessageComposer } from './ChatPanel/MessageComposer.jsx';
import { ChatHeader } from './ChatPanel/ChatHeader.jsx';
import { ChatMessages } from './ChatPanel/ChatMessages.jsx';
import { useChatScroll } from './ChatPanel/useChatScroll.js';
import { useNickContextMenu } from './ChatPanel/useNickContextMenu.js';

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
	const { scrollRef, handleScroll, handleImageLoad } = useChatScroll({
		activeTarget,
	});
	const { contextMenu, openContextMenu, closeContextMenu } =
		useNickContextMenu();

	const handleNickDoubleClick = useCallback(
		(nick) => {
			if (!onOpenDm || !nick) {
				return;
			}
			onOpenDm(nick);
		},
		[onOpenDm]
	);

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
			<ChatHeader activeTarget={activeTarget} chatState={chatState} />

			<ChatMessages
				scrollRef={scrollRef}
				onScroll={handleScroll}
				activeTarget={activeTarget}
				chatState={chatState}
				showJoinPrompt={showJoinPrompt}
				onChannelClick={onChannelClick}
				onNickContextMenu={openContextMenu}
				onNickDoubleClick={handleNickDoubleClick}
				onImageLoad={handleImageLoad}
				showMediaPreviews={showMediaPreviews}
				lastReadIndex={lastReadIndex}
				showUnreadDivider={showUnreadDivider}
			/>

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
