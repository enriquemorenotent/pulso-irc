import { MessageRowChat } from './messages/MessageRowChat.jsx';
import { MessageRowMode } from './messages/MessageRowMode.jsx';
import { MessageRowStatus } from './messages/MessageRowStatus.jsx';
import { MessageRowSystem } from './messages/MessageRowSystem.jsx';

const MessageRow = ({
	message,
	onChannelClick,
	onNickContextMenu,
	onNickDoubleClick,
	onImageLoad,
	currentNick,
	showMediaPreviews,
}) => {
	if (message.type === 'system') {
		return (
			<MessageRowSystem message={message} onChannelClick={onChannelClick} />
		);
	}

	if (message.type === 'mode') {
		return <MessageRowMode message={message} onChannelClick={onChannelClick} />;
	}

	if (
		message.type === 'join' ||
		message.type === 'part' ||
		message.type === 'quit' ||
		message.type === 'nick'
	) {
		return (
			<MessageRowStatus message={message} onChannelClick={onChannelClick} />
		);
	}

	return (
		<MessageRowChat
			message={message}
			onChannelClick={onChannelClick}
			onNickContextMenu={onNickContextMenu}
			onNickDoubleClick={onNickDoubleClick}
			onImageLoad={onImageLoad}
			currentNick={currentNick}
			showMediaPreviews={showMediaPreviews}
		/>
	);
};

export { MessageRow };
