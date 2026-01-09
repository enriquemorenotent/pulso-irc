import { ShieldCheck } from 'lucide-react';
import { splitEntities } from '../../irc/message_entities.js';
import { MessageTimestamp } from './MessageTimestamp.jsx';
import { renderEntities } from './renderEntities.jsx';

const MessageRowMode = ({ message, onChannelClick }) => {
	const mode = message.mode || null;
	const action = mode?.action || '';
	const symbol = mode?.symbol || '';
	const nick = mode?.nick || '';
	const actionText = action === 'add' ? 'gained' : 'lost';
	const modeText = message.text || `${nick} ${actionText} ${symbol}`.trim();
	const pieces = splitEntities(modeText);
	const textColor = 'text-neutral-500 dark:text-neutral-500';
	const indicatorColor = 'text-blue-600 dark:text-blue-400';

	return (
		<div className="flex items-baseline gap-4 px-4 py-0.5 text-sm leading-relaxed hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 group">
			<MessageTimestamp time={message.time} />
			<div
				className={`flex-1 min-w-0 wrap-break-words whitespace-pre-wrap ${textColor} opacity-70`}
			>
				<span
					aria-hidden="true"
					className={`inline-flex items-center justify-center w-4 h-4 mr-2 opacity-100 dark:opacity-80 align-middle relative -top-px ${indicatorColor}`}
				>
					<ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
				</span>
				{renderEntities(pieces, {
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

export { MessageRowMode };
