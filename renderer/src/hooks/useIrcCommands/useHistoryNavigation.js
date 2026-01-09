import { useRef, useCallback } from 'react';

const useHistoryNavigation = ({ messageInput, setMessageInput }) => {
	const historyRef = useRef([]);
	const historyIndexRef = useRef(null);
	const historyDraftRef = useRef('');

	const resetHistoryNavigation = useCallback(() => {
		historyIndexRef.current = null;
		historyDraftRef.current = '';
	}, []);

	const handleHistoryKeyDown = useCallback(
		(event) => {
			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
				return;
			}

			const history = historyRef.current;
			if (!history.length) {
				return;
			}

			event.preventDefault();

			const direction = event.key === 'ArrowUp' ? -1 : 1;
			const currentIndex = historyIndexRef.current;

			if (currentIndex === null) {
				historyDraftRef.current = messageInput;
				historyIndexRef.current = history.length - 1;
				setMessageInput(history[historyIndexRef.current]);
				return;
			}

			const nextIndex = currentIndex + direction;
			if (nextIndex < 0) {
				historyIndexRef.current = 0;
				setMessageInput(history[0]);
				return;
			}

			if (nextIndex >= history.length) {
				historyIndexRef.current = null;
				setMessageInput(historyDraftRef.current);
				return;
			}

			historyIndexRef.current = nextIndex;
			setMessageInput(history[nextIndex]);
		},
		[messageInput, setMessageInput]
	);

	return {
		historyRef,
		resetHistoryNavigation,
		handleHistoryKeyDown,
	};
};

export { useHistoryNavigation };
