import { useCallback, useState } from 'react';

const useNickContextMenu = () => {
	const [contextMenu, setContextMenu] = useState(null);

	const openContextMenu = useCallback((event, nick) => {
		if (!nick) {
			return;
		}
		event.preventDefault();
		setContextMenu({
			x: event.clientX,
			y: event.clientY,
			nick,
		});
	}, []);

	const closeContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	return {
		contextMenu,
		openContextMenu,
		closeContextMenu,
	};
};

export { useNickContextMenu };
