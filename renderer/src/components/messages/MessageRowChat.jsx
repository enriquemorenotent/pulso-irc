import { getNickColorClasses, parseIrcFormatting } from '../../irc/formatting.js';
import { collectMediaLinks } from '../../irc/message_entities.js';
import { EmbeddedMediaGrid } from './EmbeddedMedia.jsx';
import { MessageTimestamp } from './MessageTimestamp.jsx';
import { renderFormattedSegments } from './renderEntities.jsx';

const MessageRowChat = ({
	message,
	onChannelClick,
	onNickContextMenu,
	onNickDoubleClick,
	onImageLoad,
	currentNick,
	showMediaPreviews,
}) => {
	const segments = parseIrcFormatting(message.text || '');
	const isNotice = message.type === 'notice';
	const hasNick = Boolean(message.from);
	const hasNickActions = Boolean(onNickContextMenu || onNickDoubleClick);
	const shouldShowNickActions = hasNick && hasNickActions;
	const nickColor = !isNotice ? getNickColorClasses(message.from) : null;
	const isSelf =
		Boolean(message.from && currentNick) &&
		message.from.toLowerCase() === currentNick.toLowerCase();

	const nameClass = isNotice
		? 'text-amber-600 dark:text-amber-400'
		: nickColor
		? nickColor.text
		: 'text-neutral-900 dark:text-neutral-200';

	const highlightClass = message.highlight
		? 'bg-orange-50 dark:bg-orange-950/30'
		: 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50';
	const selfClass = isSelf
		? message.highlight
			? 'border-l-2 border-sky-300/70 dark:border-sky-700/60'
			: 'border-l-2 border-sky-300/70 bg-sky-50/60 dark:border-sky-700/60 dark:bg-sky-950/20 hover:bg-sky-100/60 dark:hover:bg-sky-950/30'
		: '';

	const mediaLinks = showMediaPreviews ? collectMediaLinks(segments) : [];
	const showMedia = showMediaPreviews && mediaLinks.length > 0;

	return (
		<div
			className={`flex items-baseline gap-4 px-4 py-0.5 text-sm leading-relaxed group ${highlightClass} ${selfClass}`}
		>
			<MessageTimestamp time={message.time} />
			<div className="flex-1 min-w-0">
				{message.type === 'action' && (
					<span className="mr-1 text-rose-600 font-bold dark:text-rose-400">
						*
					</span>
				)}
				<span
					className={`font-semibold mr-2 ${nameClass} ${
						message.type === 'action' ? 'italic' : ''
					} ${
						shouldShowNickActions
							? 'cursor-pointer hover:underline'
							: ''
					}`}
					onContextMenu={(event) => {
						if (!shouldShowNickActions || !onNickContextMenu) {
							return;
						}
						event.preventDefault();
						onNickContextMenu(event, message.from);
					}}
					onDoubleClick={() => {
						if (!shouldShowNickActions || !onNickDoubleClick) {
							return;
						}
						onNickDoubleClick(message.from);
					}}
					title={
						shouldShowNickActions
							? 'Double-click to message, right-click for options'
							: undefined
					}
				>
					{message.from}
				</span>
				<span
					className={`break-words whitespace-pre-wrap text-neutral-800 tracking-[0.01em] dark:text-neutral-300 ${
						message.type === 'action' ? 'italic' : ''
					}`}
				>
					{renderFormattedSegments(segments, {
						onChannelClick,
						linkClass:
							'underline underline-offset-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
						channelClass:
							'underline underline-offset-2 text-blue-600 hover:text-blue-700 cursor-pointer dark:text-blue-400 dark:hover:text-blue-300',
					})}
				</span>
				{showMedia && (
					<EmbeddedMediaGrid
						media={mediaLinks}
						onImageLoad={onImageLoad}
					/>
				)}
			</div>
		</div>
	);
};

export { MessageRowChat };
