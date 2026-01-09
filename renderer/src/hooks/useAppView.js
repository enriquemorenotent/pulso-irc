import { useMemo, useCallback } from 'react';

const useAppView = ({ activeView, setActiveView, hasConnections, onOpenConnect }) => {
	const openConnect = useCallback(() => {
		if (onOpenConnect) {
			onOpenConnect();
			return;
		}
		setActiveView('connect');
	}, [onOpenConnect, setActiveView]);

	const openChat = useCallback(() => {
		setActiveView('chat');
	}, [setActiveView]);

	const openProfiles = useCallback(() => {
		setActiveView('profiles');
	}, [setActiveView]);

	const openFriends = useCallback(() => {
		setActiveView('friends');
	}, [setActiveView]);

	const openBlocklist = useCallback(() => {
		setActiveView('blocklist');
	}, [setActiveView]);

	const openSettings = useCallback(() => {
		setActiveView('settings');
	}, [setActiveView]);

	const closeOverlay = useCallback(() => {
		if (hasConnections) {
			setActiveView('chat');
			return;
		}
		openConnect();
	}, [hasConnections, openConnect, setActiveView]);

	const onBack = useMemo(() => {
		if (activeView === 'chat') {
			return null;
		}
		if (hasConnections) {
			return openChat;
		}
		if (activeView === 'profiles') {
			return openConnect;
		}
		return null;
	}, [activeView, hasConnections, openChat, openConnect]);

	const backLabel = onBack
		? hasConnections
			? 'Back to Chat'
			: 'Back to Connections'
		: null;

	return {
		openConnect,
		openChat,
		openProfiles,
		openFriends,
		openBlocklist,
		openSettings,
		closeOverlay,
		onBack,
		backLabel,
	};
};

export { useAppView };
