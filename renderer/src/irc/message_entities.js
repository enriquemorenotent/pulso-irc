const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const trailingPunctuation = /[),.;!?]+$/;
const channelRegex = /(^|[^A-Za-z0-9_])([#&][^\s,]+)/g;
const imageUrlRegex = /\.(?:png|jpe?g|gif|webp|avif)(?:$|[?#])/i;
const gifvUrlRegex = /\.(?:gifv)(?:$|[?#])/i;
const imageExtensions = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.avif',
];
const gifvExtensions = ['.gifv'];

const normalizeUrl = (value) =>
	/^https?:\/\//i.test(value) ? value : `https://${value}`;

const isImageUrl = (value) => {
	const href = normalizeUrl(value);
	try {
		const url = new URL(href);
		const path = url.pathname.toLowerCase();
		return imageExtensions.some((ext) => path.endsWith(ext));
	} catch {
		return imageUrlRegex.test(value);
	}
};

const isGifvUrl = (value) => {
	const href = normalizeUrl(value);
	try {
		const url = new URL(href);
		const path = url.pathname.toLowerCase();
		return gifvExtensions.some((ext) => path.endsWith(ext));
	} catch {
		return gifvUrlRegex.test(value);
	}
};

const gifvToMp4 = (value) => {
	const href = normalizeUrl(value);
	try {
		const url = new URL(href);
		const lowerPath = url.pathname.toLowerCase();
		if (lowerPath.endsWith('.gifv')) {
			url.pathname = url.pathname.slice(0, -5) + '.mp4';
			return url.toString();
		}
	} catch {
		return href.replace(/\.gifv(?=($|[?#]))/i, '.mp4');
	}

	return href;
};

const splitLinks = (text) => {
	if (!text) {
		return [];
	}

	const matches = [...text.matchAll(urlRegex)];
	if (!matches.length) {
		return [{ type: 'text', value: text }];
	}

	const parts = [];
	let lastIndex = 0;

	matches.forEach((match) => {
		const start = match.index ?? 0;
		const raw = match[0];

		if (start > lastIndex) {
			parts.push({ type: 'text', value: text.slice(lastIndex, start) });
		}

		let url = raw;
		let trailing = '';
		while (trailingPunctuation.test(url)) {
			trailing = url.slice(-1) + trailing;
			url = url.slice(0, -1);
		}

		if (url) {
			parts.push({ type: 'link', value: url });
		}
		if (trailing) {
			parts.push({ type: 'text', value: trailing });
		}

		lastIndex = start + raw.length;
	});

	if (lastIndex < text.length) {
		parts.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return parts;
};

const splitChannels = (text) => {
	if (!text) {
		return [];
	}

	const matches = [...text.matchAll(channelRegex)];
	if (!matches.length) {
		return [{ type: 'text', value: text }];
	}

	const parts = [];
	let lastIndex = 0;

	matches.forEach((match) => {
		const start = match.index ?? 0;
		const boundary = match[1] || '';
		const raw = match[2] || '';
		const channelStart = start + boundary.length;

		if (channelStart > lastIndex) {
			parts.push({
				type: 'text',
				value: text.slice(lastIndex, channelStart),
			});
		}

		let channel = raw;
		let trailing = '';
		while (trailingPunctuation.test(channel)) {
			trailing = channel.slice(-1) + trailing;
			channel = channel.slice(0, -1);
		}

		if (channel && channel.length > 1) {
			parts.push({ type: 'channel', value: channel });
		} else if (raw) {
			parts.push({ type: 'text', value: raw });
		}

		if (trailing) {
			parts.push({ type: 'text', value: trailing });
		}

		lastIndex = channelStart + raw.length;
	});

	if (lastIndex < text.length) {
		parts.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return parts;
};

const splitEntities = (text) =>
	splitLinks(text).flatMap((part) =>
		part.type === 'text' ? splitChannels(part.value) : [part]
	);

const collectMediaLinks = (segments) => {
	const seen = new Set();
	const media = [];

	segments.forEach((segment) => {
		splitLinks(segment.text).forEach((part) => {
			if (part.type !== 'link') {
				return;
			}

			const href = normalizeUrl(part.value);
			if (isImageUrl(href)) {
				const key = `image:${href}`;
				if (!seen.has(key)) {
					seen.add(key);
					media.push({ type: 'image', src: href, original: href });
				}
				return;
			}

			if (isGifvUrl(href)) {
				const videoSrc = gifvToMp4(href);
				const key = `video:${videoSrc}`;
				if (!seen.has(key)) {
					seen.add(key);
					media.push({ type: 'video', src: videoSrc, original: href });
				}
			}
		});
	});

	return media;
};

export { collectMediaLinks, normalizeUrl, splitEntities };
