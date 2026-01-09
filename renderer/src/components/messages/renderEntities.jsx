import { getIrcColorClasses } from '../../irc/formatting.js';
import { normalizeUrl, splitEntities } from '../../irc/message_entities.js';

const renderEntities = (pieces, { onChannelClick, linkClass, channelClass }) =>
	pieces.map((piece, index) => {
		if (piece.type === 'link') {
			const href = normalizeUrl(piece.value);
			return (
				<a
					key={`${piece.value}-${index}`}
					href={href}
					target="_blank"
					rel="noreferrer"
					className={linkClass}
				>
					{piece.value}
				</a>
			);
		}

		if (piece.type === 'channel') {
			return (
				<button
					key={`${piece.value}-${index}`}
					type="button"
					onClick={() => onChannelClick && onChannelClick(piece.value)}
					className={channelClass}
				>
					{piece.value}
				</button>
			);
		}

		return <span key={`${piece.value}-${index}`}>{piece.value}</span>;
	});

const renderFormattedSegments = (
	segments,
	{ onChannelClick, linkClass, channelClass }
) =>
	segments.map((segment, index) => {
		const fgClasses = getIrcColorClasses(segment.fg);
		const bgClasses = getIrcColorClasses(segment.bg);
		const colorClasses = [
			fgClasses ? fgClasses.text : '',
			bgClasses ? bgClasses.bg : '',
		]
			.filter(Boolean)
			.join(' ');
		const pieces = splitEntities(segment.text);
		const baseClass = [
			segment.bold ? 'font-bold' : '',
			segment.italic ? 'italic' : '',
			segment.underline ? 'underline' : '',
			colorClasses,
		]
			.filter(Boolean)
			.join(' ');

		return (
			<span key={`${segment.text}-${index}`} className={baseClass}>
				{renderEntities(pieces, {
					onChannelClick,
					linkClass: [linkClass, colorClasses].filter(Boolean).join(' '),
					channelClass: [channelClass, colorClasses]
						.filter(Boolean)
						.join(' '),
				})}
			</span>
		);
	});

export { renderEntities, renderFormattedSegments };
