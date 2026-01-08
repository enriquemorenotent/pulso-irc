import { useState, useCallback, useEffect } from 'react';
import {
	getIrcColorClasses,
	parseIrcFormatting,
	getNickColorClasses,
} from '../irc/formatting.js';
import {
	collectMediaLinks,
	normalizeUrl,
	splitEntities,
} from '../irc/message_entities.js';
import { RoleBadge } from './RoleBadge.jsx';

const useLightbox = () => {
	const [expanded, setExpanded] = useState(false);
	const [closing, setClosing] = useState(false);

	const open = useCallback(() => {
		setClosing(false);
		setExpanded(true);
	}, []);

	const close = useCallback(() => {
		if (!expanded || closing) {
			return;
		}
		setClosing(true);
	}, [expanded, closing]);

	const handleOverlayAnimationEnd = useCallback(() => {
		if (!closing) {
			return;
		}
		setExpanded(false);
		setClosing(false);
	}, [closing]);

	useEffect(() => {
		if (!expanded) {
			return undefined;
		}

		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				close();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [expanded, close]);

	return { expanded, closing, open, close, handleOverlayAnimationEnd };
};

const EmbeddedImage = ({ src, href = null, onImageLoad = null }) => {
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState(false);
	const { expanded, closing, open, close, handleOverlayAnimationEnd } =
		useLightbox();

	const handleLoad = useCallback(() => {
		setLoaded(true);
		if (onImageLoad) {
			onImageLoad();
		}
	}, [onImageLoad]);
	const handleError = useCallback(() => setError(true), []);
	const openHref = href || src;

	if (error) {
		return (
			<div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
					/>
				</svg>
				<span>Failed to load image</span>
			</div>
		);
	}

	return (
		<>
			<div className="group relative inline-block">
				{/* Loading skeleton */}
				{!loaded && (
					<div className="w-48 h-32 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				)}
				{/* Thumbnail */}
				<img
					src={src}
					alt="Embedded image"
					loading="lazy"
					decoding="async"
					referrerPolicy="no-referrer"
					onLoad={handleLoad}
					onError={handleError}
					onClick={open}
					className={`
						max-w-xs max-h-48 rounded-lg object-cover cursor-zoom-in
						border border-neutral-200 dark:border-neutral-700
						shadow-sm hover:shadow-md
						transition-all duration-200 ease-out
						hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600
						${loaded ? 'opacity-100' : 'opacity-0 absolute'}
					`}
				/>
				{/* Overlay actions */}
				{loaded && (
					<div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
						<a
							href={openHref}
							target="_blank"
							rel="noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors"
							title="Open in new tab"
						>
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
						</a>
					</div>
				)}
			</div>

			{/* Lightbox overlay */}
			{expanded && (
				<div
					className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${
						closing ? 'animate-fade-out' : 'animate-fade-in'
					}`}
					onClick={close}
					onAnimationEnd={handleOverlayAnimationEnd}
				>
					<div className="relative max-w-[90vw] max-h-[90vh]">
						<img
							src={src}
							alt="Embedded image (expanded)"
							className={`max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain ${
								closing
									? 'animate-scale-out'
									: 'animate-scale-in'
							}`}
						/>
						<div className="absolute top-3 right-3 flex gap-2">
							<a
								href={openHref}
								target="_blank"
								rel="noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
								title="Open in new tab"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</a>
							<button
								type="button"
								onClick={close}
								className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
								title="Close"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

const EmbeddedVideo = ({ src, href = null }) => {
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState(false);
	const { expanded, closing, open, close, handleOverlayAnimationEnd } =
		useLightbox();

	const handleLoaded = useCallback(() => setLoaded(true), []);
	const handleError = useCallback(() => setError(true), []);
	const openHref = href || src;

	if (error) {
		return (
			<div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
					/>
				</svg>
				<span>Failed to load preview</span>
			</div>
		);
	}

	return (
		<>
			<div className="group relative inline-block">
				{!loaded && (
					<div className="w-48 h-32 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				)}
				<video
					src={src}
					muted
					loop
					playsInline
					autoPlay
					preload="metadata"
					onLoadedData={handleLoaded}
					onError={handleError}
					onClick={open}
					className={`
						max-w-xs max-h-48 rounded-lg object-cover cursor-zoom-in
						border border-neutral-200 dark:border-neutral-700
						shadow-sm hover:shadow-md
						transition-all duration-200 ease-out
						hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600
						${loaded ? 'opacity-100' : 'opacity-0 absolute'}
					`}
				/>
				{loaded && (
					<div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
						<a
							href={openHref}
							target="_blank"
							rel="noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors"
							title="Open in new tab"
						>
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
						</a>
					</div>
				)}
			</div>

			{expanded && (
				<div
					className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${
						closing ? 'animate-fade-out' : 'animate-fade-in'
					}`}
					onClick={close}
					onAnimationEnd={handleOverlayAnimationEnd}
				>
					<div className="relative max-w-[90vw] max-h-[90vh]">
						<video
							src={src}
							muted
							loop
							playsInline
							autoPlay
							className={`max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain ${
								closing
									? 'animate-scale-out'
									: 'animate-scale-in'
							}`}
						/>
						<div className="absolute top-3 right-3 flex gap-2">
							<a
								href={openHref}
								target="_blank"
								rel="noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
								title="Open in new tab"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</a>
							<button
								type="button"
								onClick={close}
								className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
								title="Close"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

const EmbeddedMediaGrid = ({ media, onImageLoad = null }) => {
	const count = media.length;

	if (count === 0) return null;

	// Single media - larger display
	if (count === 1) {
		const item = media[0];
		return (
			<div className="mt-3">
				{item.type === 'video' ? (
					<EmbeddedVideo src={item.src} href={item.original} />
				) : (
					<EmbeddedImage
						src={item.src}
						href={item.original}
						onImageLoad={onImageLoad}
					/>
				)}
			</div>
		);
	}

	// Multiple images - grid layout
	return (
		<div
			className={`mt-3 flex flex-wrap gap-2 ${
				count > 4 ? 'max-w-lg' : ''
			}`}
		>
			{media.map((item) =>
				item.type === 'video' ? (
					<EmbeddedVideo
						key={`${item.type}-${item.src}`}
						src={item.src}
						href={item.original}
					/>
				) : (
					<EmbeddedImage
						key={`${item.type}-${item.src}`}
						src={item.src}
						href={item.original}
						onImageLoad={onImageLoad}
					/>
				)
			)}
		</div>
	);
};

const getDisplayTime = (value) => {
	if (!value) {
		return '';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return date.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
};

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
				{pieces.map((piece, pieceIndex) => {
					if (piece.type === 'link') {
						const href = normalizeUrl(piece.value);
						return (
							<a
								key={`${piece.value}-${pieceIndex}`}
								href={href}
								target="_blank"
								rel="noreferrer"
								className={[linkClass, colorClasses]
									.filter(Boolean)
									.join(' ')}
							>
								{piece.value}
							</a>
						);
					}

					if (piece.type === 'channel') {
						return (
							<button
								key={`${piece.value}-${pieceIndex}`}
								type="button"
								onClick={() =>
									onChannelClick &&
									onChannelClick(piece.value)
								}
								className={[channelClass, colorClasses]
									.filter(Boolean)
									.join(' ')}
							>
								{piece.value}
							</button>
						);
					}

					return (
						<span key={`${piece.value}-${pieceIndex}`}>
							{piece.value}
						</span>
					);
				})}
			</span>
		);
	});

const MessageTimestamp = ({ time }) => (
	<div className="w-12.5 shrink-0 text-right font-mono text-xs text-neutral-400 select-none dark:text-neutral-500">
		{getDisplayTime(time)}
	</div>
);

const MessageRow = ({
	message,
	onChannelClick,
	onNickContextMenu,
	onNickDoubleClick,
	onImageLoad,
	currentNick,
	showMediaPreviews,
}) => {
	// 1. System Messages
	if (message.type === 'system') {
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
	}

	// 2. Mode role changes
	if (message.type === 'mode') {
		const mode = message.mode || null;
		const action = mode?.action || '';
		const symbol = mode?.symbol || '';
		const nick = mode?.nick || '';
		const actionText = action === 'add' ? 'gained' : 'lost';

		if (!action || !symbol || !nick) {
			const fallback = parseIrcFormatting(message.text || '');
			return (
				<div className="flex items-baseline gap-4 px-4 py-0.5 text-sm leading-relaxed hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 group">
					<MessageTimestamp time={message.time} />
					<div className="flex-1 min-w-0 break-words whitespace-pre-wrap font-mono text-neutral-500 dark:text-neutral-400">
						{renderFormattedSegments(fallback, {
							onChannelClick,
							linkClass:
								'underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-400',
							channelClass:
								'underline underline-offset-2 hover:text-blue-700 cursor-pointer dark:hover:text-blue-400',
						})}
					</div>
				</div>
			);
		}

		return (
			<div className="flex items-baseline gap-4 px-4 py-0.5 text-sm leading-relaxed hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 group">
				<MessageTimestamp time={message.time} />
				<div className="flex-1 min-w-0 break-words whitespace-pre-wrap text-neutral-500 dark:text-neutral-500">
					<span className="inline-flex items-center gap-2">
						<span>{nick}</span>
						<span>{actionText}</span>
						<RoleBadge symbol={symbol} />
					</span>
				</div>
			</div>
		);
	}

	// 3. Join/Part/Quit
	if (
		message.type === 'join' ||
		message.type === 'part' ||
		message.type === 'quit' ||
		message.type === 'nick'
	) {
		const pieces = splitEntities(message.text || '');
		const textColor = 'text-neutral-500 dark:text-neutral-500';
		const indicatorColor =
			message.type === 'join'
				? 'text-green-600 dark:text-green-400'
				: message.type === 'part'
				? 'text-yellow-600 dark:text-yellow-400'
				: message.type === 'quit'
				? 'text-red-600 dark:text-red-400'
				: 'text-blue-600 dark:text-blue-400';

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
						{message.type === 'join' && (
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.4}
									d="M4.5 4.5v15M9 12h10m0 0-3-3m3 3-3 3"
								/>
							</svg>
						)}
						{message.type === 'part' && (
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.4}
									d="M19.5 4.5v15M15 12H5m0 0 3-3m-3 3 3 3"
								/>
							</svg>
						)}
						{message.type === 'quit' && (
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.4}
									d="M12 3v7m-4.6-3.1a7.5 7.5 0 109.2 0"
								/>
							</svg>
						)}
						{message.type === 'nick' && (
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.4}
									d="M7 7h10M7 12h10M7 17h6"
								/>
							</svg>
						)}
					</span>
					{pieces.map((piece, index) => {
						if (piece.type === 'link') {
							const href = normalizeUrl(piece.value);
							return (
								<a
									key={`${piece.value}-${index}`}
									href={href}
									target="_blank"
									rel="noreferrer"
									className="underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-400"
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
									onClick={() =>
										onChannelClick &&
										onChannelClick(piece.value)
									}
									className="underline underline-offset-2 hover:text-blue-700 cursor-pointer dark:hover:text-blue-400"
								>
									{piece.value}
								</button>
							);
						}

						return (
							<span key={`${piece.value}-${index}`}>
								{piece.value}
							</span>
						);
					})}
				</div>
			</div>
		);
	}

	// 4. Regular Messages (Private, Channel, etc.)
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

export { MessageRow };
