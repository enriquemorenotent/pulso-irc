import { useCallback, useEffect, useRef } from 'react';

const useChatScroll = ({ activeTarget }) => {
	const scrollRef = useRef(null);
	const isNearBottomRef = useRef(true);

	const checkIfNearBottom = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return true;
		const threshold = 100;
		return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
	}, []);

	const scrollToBottom = useCallback(() => {
		const el = scrollRef.current;
		if (el) {
			el.scrollTop = el.scrollHeight;
		}
	}, []);

	useEffect(() => {
		if (isNearBottomRef.current) {
			scrollToBottom();
		}
	}, [activeTarget.messages.length, activeTarget.name, scrollToBottom]);

	const handleImageLoad = useCallback(() => {
		if (isNearBottomRef.current) {
			scrollToBottom();
		}
	}, [scrollToBottom]);

	const handleScroll = useCallback(() => {
		isNearBottomRef.current = checkIfNearBottom();
	}, [checkIfNearBottom]);

	return {
		scrollRef,
		handleScroll,
		handleImageLoad,
	};
};

export { useChatScroll };
