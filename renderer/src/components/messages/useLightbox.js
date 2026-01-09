import { useState, useCallback, useEffect } from 'react';

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

export { useLightbox };
