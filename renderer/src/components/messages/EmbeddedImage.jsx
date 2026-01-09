import { Ban, ExternalLink, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useLightbox } from './useLightbox.js';

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
				<Ban className="w-4 h-4" strokeWidth={1.5} />
				<span>Failed to load image</span>
			</div>
		);
	}

	return (
		<>
			<div className="group relative inline-block">
				{!loaded && (
					<div className="w-48 h-32 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				)}
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
							<ExternalLink className="w-3.5 h-3.5" />
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
								<ExternalLink className="w-5 h-5" />
							</a>
							<button
								type="button"
								onClick={close}
								className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
								title="Close"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export { EmbeddedImage };
