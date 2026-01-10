const createConnectionLifecycle = ({
	connections,
	setConnections,
	getWsRef,
	getPendingJoinsRef,
	getNickRetryRef,
	getRejoinTargetsRef,
	getConnectedAtRef,
	isBlocked,
	addStatusNote,
	updateChatState,
	sendMessage,
	createGatewayMessageHandler,
	createGatewaySocket,
	getOnIrcEventRef,
	readyState,
	applyHistory,
	loadHistory,
	createInitialChatState,
	withStatus,
	clearChannelUsersOnDisconnect,
	clearConnectionRefs,
	createNickRetryState,
	clearHistoryRefs,
}) => {
	const connect = ({
		connectionId,
		profileId,
		profileName,
		settings,
		clientCert,
		clientKey,
		existingChatState,
	}) => {
		const wsRef = getWsRef();
		const pendingJoinsRef = getPendingJoinsRef();
		const nickRetryRef = getNickRetryRef();
		const rejoinTargetsRef = getRejoinTargetsRef();
		const connectedAtRef = getConnectedAtRef();
		const onIrcEventRef = getOnIrcEventRef();

		if (typeof window === 'undefined' || !window.pulsoGateway) {
			const chatState = withStatus(
				createInitialChatState(settings.nick),
				'error',
				'Desktop runtime not available'
			);
			setConnections((prev) => ({
				...prev,
				[connectionId]: {
					id: connectionId,
					profileId,
					profileName,
					settings,
					chatState,
				},
			}));
			return;
		}

		const existing = wsRef.current[connectionId];
		if (
			existing &&
			(existing.readyState === readyState.OPEN ||
				existing.readyState === readyState.CONNECTING)
		) {
			return;
		}

		if (existing) {
			existing.close();
			wsRef.current[connectionId] = null;
		}

		const baseState = existingChatState
			? {
					...existingChatState,
					me: settings.nick || existingChatState.me,
			  }
			: createInitialChatState(settings.nick);
		const connectingState = withStatus(baseState, 'connecting', '');
		connectedAtRef.current[connectionId] = Date.now();
		const rejoinTargets = new Set();
		if (existingChatState?.targets) {
			Object.entries(existingChatState.targets).forEach(
				([name, target]) => {
					if (target?.type !== 'channel') {
						return;
					}
					if (!target.joined) {
						return;
					}
					rejoinTargets.add(name);
				}
			);
		}
		if (rejoinTargetsRef) {
			rejoinTargetsRef.current[connectionId] = rejoinTargets;
		}
		const history = existingChatState
			? null
			: loadHistory(connectionId, settings.host);
		const initial = existingChatState
			? connectingState
			: applyHistory(connectingState, history, { includeDms: false });
		pendingJoinsRef.current[connectionId] = new Set();
		nickRetryRef.current[connectionId] = createNickRetryState(
			settings.nick,
			true
		);
		setConnections((prev) => ({
			...prev,
			[connectionId]: {
				id: connectionId,
				profileId,
				profileName,
				settings,
				chatState: initial,
			},
		}));

		const ws = createGatewaySocket();
		wsRef.current[connectionId] = ws;
		addStatusNote(connectionId, 'Connecting to local gateway.');

		const handleGatewayMessage = createGatewayMessageHandler({
			connectionId,
			settings,
			clientCert,
			clientKey,
			sendMessage,
			updateChatState,
			addStatusNote,
			onIrcEventRef,
			isBlocked,
			pendingJoinsRef,
			nickRetryRef,
			rejoinTargetsRef,
			connectedAtRef,
		});
		ws.addEventListener('message', handleGatewayMessage);

		ws.addEventListener('close', () => {
			updateChatState(connectionId, (prev) => {
				const clearedState = clearChannelUsersOnDisconnect(prev);
				return withStatus(clearedState, 'closed', prev.error);
			});
			addStatusNote(connectionId, 'Gateway connection closed.');
			clearConnectionRefs({
				connectionId,
				pendingJoinsRef,
				nickRetryRef,
				rejoinTargetsRef,
				connectedAtRef,
				clearHistoryRefs,
			});
		});

		ws.addEventListener('error', () => {
			updateChatState(connectionId, (prev) =>
				withStatus(prev, 'error', 'Gateway error')
			);
			addStatusNote(connectionId, 'Gateway error.');
		});
	};

	const disconnect = (connectionId) => {
		const connection = connections[connectionId];
		if (!connection) {
			return;
		}
		const wsRef = getWsRef();
		const pendingJoinsRef = getPendingJoinsRef();
		const nickRetryRef = getNickRetryRef();
		const rejoinTargetsRef = getRejoinTargetsRef();
		const connectedAtRef = getConnectedAtRef();

		const ws = wsRef.current[connectionId];
		if (ws && ws.readyState === readyState.OPEN) {
			sendMessage(connectionId, {
				type: 'disconnect',
				connId: connection.settings.connId,
				reason: 'client_request',
			});
		}

		if (ws) {
			ws.close();
			wsRef.current[connectionId] = null;
		}

		clearConnectionRefs({
			connectionId,
			pendingJoinsRef,
			nickRetryRef,
			rejoinTargetsRef,
			connectedAtRef,
			clearHistoryRefs,
		});
		setConnections((prev) => {
			const existing = prev[connectionId];
			if (!existing) {
				return prev;
			}
			const clearedState = clearChannelUsersOnDisconnect(
				existing.chatState
			);
			return {
				...prev,
				[connectionId]: {
					...existing,
					chatState: withStatus(
						clearedState,
						'closed',
						existing.chatState.error
					),
				},
			};
		});
	};

	const close = (connectionId) => {
		const connection = connections[connectionId];
		if (!connection) {
			return;
		}
		const wsRef = getWsRef();
		const pendingJoinsRef = getPendingJoinsRef();
		const nickRetryRef = getNickRetryRef();
		const rejoinTargetsRef = getRejoinTargetsRef();
		const connectedAtRef = getConnectedAtRef();

		const ws = wsRef.current[connectionId];
		if (ws && ws.readyState === readyState.OPEN) {
			sendMessage(connectionId, {
				type: 'disconnect',
				connId: connection.settings.connId,
				reason: 'client_request',
			});
		}

		if (ws) {
			ws.close();
			wsRef.current[connectionId] = null;
		}

		clearConnectionRefs({
			connectionId,
			pendingJoinsRef,
			nickRetryRef,
			rejoinTargetsRef,
			connectedAtRef,
			clearHistoryRefs,
		});
		setConnections((prev) => {
			if (!prev[connectionId]) {
				return prev;
			}
			const next = { ...prev };
			delete next[connectionId];
			return next;
		});
	};

	return { connect, disconnect, close };
};

export { createConnectionLifecycle };
