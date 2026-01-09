import { useCallback, useMemo, useState } from 'react';
import { createListState } from '../irc/state.js';

const useChannelListModal = ({ connections, updateChatState, sendMessage }) => {
	const [listModal, setListModal] = useState({
		open: false,
		connectionId: null,
	});

	const buildLoadingListState = useCallback(
		() => createListState({ status: 'loading', error: '' }),
		[]
	);

	const resetListState = useCallback(
		(connectionId) => {
			if (!connectionId) {
				return false;
			}
			if (!connections[connectionId]) {
				return false;
			}
			updateChatState(connectionId, (prev) => ({
				...prev,
				list: buildLoadingListState(),
			}));
			return true;
		},
		[buildLoadingListState, connections, updateChatState]
	);

	const canSendList = useCallback(
		(connectionId) => {
			const connection = connections[connectionId];
			if (!connection) {
				return false;
			}
			if (connection.chatState?.status !== 'connected') {
				return false;
			}
			return Boolean(connection.settings?.connId);
		},
		[connections]
	);

	const sendListRequest = useCallback(
		(connectionId) => {
			if (!canSendList(connectionId)) {
				return false;
			}
			const connection = connections[connectionId];
			const connId = connection.settings?.connId;
			if (!connId) {
				return false;
			}
			sendMessage(connectionId, {
				type: 'irc_send',
				connId,
				line: 'LIST',
			});
			return true;
		},
		[canSendList, connections, sendMessage]
	);

	const openChannelList = useCallback(
		(connectionId, options = {}) => {
			if (!connectionId) {
				return;
			}
			setListModal({ open: true, connectionId });
			const shouldReset = Boolean(options.reset);
			const shouldSend = Boolean(options.sendList);
			if (shouldReset) {
				resetListState(connectionId);
			}
			if (shouldSend) {
				if (shouldReset && !canSendList(connectionId)) {
					updateChatState(connectionId, (prev) => ({
						...prev,
						list: createListState({
							...(prev.list || {}),
							status: 'error',
							error: 'Not connected.',
						}),
					}));
					return;
				}
				sendListRequest(connectionId);
			}
		},
		[canSendList, resetListState, sendListRequest, updateChatState]
	);

	const closeChannelList = useCallback(() => {
		setListModal({ open: false, connectionId: null });
	}, []);

	const refreshChannelList = useCallback(() => {
		if (!listModal.connectionId) {
			return;
		}
		if (!canSendList(listModal.connectionId)) {
			updateChatState(listModal.connectionId, (prev) => ({
				...prev,
				list: createListState({
					...(prev.list || {}),
					status: 'error',
					error: 'Not connected.',
				}),
			}));
			return;
		}
		resetListState(listModal.connectionId);
		sendListRequest(listModal.connectionId);
	}, [canSendList, listModal.connectionId, resetListState, sendListRequest, updateChatState]);

	const listConnection = listModal.open
		? connections[listModal.connectionId]
		: null;
	const listChatState = listConnection?.chatState || null;
	const listState = listChatState?.list || {
		status: 'idle',
		items: [],
		total: 0,
		truncated: false,
		error: '',
	};

	const listJoinedChannels = useMemo(() => {
		if (!listChatState) {
			return new Set();
		}
		const joined = new Set();
		Object.entries(listChatState.targets || {}).forEach(([name, target]) => {
			if (target.type === 'channel' && target.joined) {
				joined.add(name.toLowerCase());
			}
		});
		return joined;
	}, [listChatState]);

	return {
		listModal,
		listConnection,
		listState,
		listJoinedChannels,
		openChannelList,
		closeChannelList,
		refreshChannelList,
	};
};

export { useChannelListModal };
