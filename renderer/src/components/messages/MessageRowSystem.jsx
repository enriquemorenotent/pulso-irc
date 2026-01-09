import { parseIrcFormatting } from '../../irc/formatting.js';
import { MessageTimestamp } from './MessageTimestamp.jsx';
import { renderFormattedSegments } from './renderEntities.jsx';

const MessageRowSystem = ({ message, onChannelClick }) => {
	const segments = parseIrcFormatting(message.text || '');
	return (
		<div className="flex items-baseline gap-4 px-4 py-0.5 text-sm leading-relaxed hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 group">
			<MessageTimestamp time={message.time} />
			<div className="flex-1 min-w-0 break-words whitespace-pre-wrap font-mono text-neutral-500 dark:text-neutral-400">
				{renderFormattedSegments(segments, {
					onChannelClick,
					linkClass:
						'underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-400',
					channelClass:
						'underline underline-offset-2 hover:text-blue-700 cursor-pointer dark:hover:text-blue-400',
				})}
			</div>
		</div>
	);
};

export { MessageRowSystem };
