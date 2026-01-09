import { EmbeddedImage } from './EmbeddedImage.jsx';
import { EmbeddedVideo } from './EmbeddedVideo.jsx';

const EmbeddedMediaGrid = ({ media, onImageLoad = null }) => {
	const count = media.length;

	if (count === 0) return null;

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

	return (
		<div className={`mt-3 flex flex-wrap gap-2 ${count > 4 ? 'max-w-lg' : ''}`}>
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

export { EmbeddedMediaGrid };
