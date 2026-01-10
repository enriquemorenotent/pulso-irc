import { useRef, useState, useEffect } from 'react';
import { applyHistory, loadHistory } from '../irc/history.js';
import {
	addSystemMessage,
	clearChannelUsersOnDisconnect,
	createInitialChatState,
	STATUS_TARGET,
	withStatus,
} from '../irc/state.js';
import { createGatewaySocket, READY_STATE } from '../gateway/socket.js';
import {
	createNickRetryState,
	extractJoinTargets,
} from './useConnections/helpers.js';
import { createGatewayMessageHandler } from './useConnections/gatewayHandlers.js';
import { createHistoryManager } from './useConnections/history.js';
import { clearConnectionRefs } from './useConnections/cleanup.js';
import { createConnectionLifecycle } from './useConnections/lifecycle.js';

const useConnections = ({ onIrcEvent, isBlocked }) => {
	const [connections, setConnections] = useState({});
	const wsRef = useRef({});
	const pendingJoinsRef = useRef({});
	const nickRetryRef = useRef({});
	const rejoinTargetsRef = useRef({});
	const historySaveRef = useRef({});
	const historyPendingRef = useRef({});
	const connectedAtRef = useRef({});
	const onIrcEventRef = useRef(onIrcEvent);
	useEffect(() => {
		onIrcEventRef.current = onIrcEvent;
	}, [onIrcEvent]);
	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}

		const handleBeforeUnload = () => {
			Object.values(wsRef.current).forEach((socket) => {
				if (socket && typeof socket.close === 'function') {
					socket.close();
				}
			});
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, []);

	const { scheduleHistorySave, flushHistorySave, clearHistoryRefs } =
		createHistoryManager({
			getHistorySaveRef: () => historySaveRef,
			getHistoryPendingRef: () => historyPendingRef,
		});
	const updateChatState = (connectionId, updater) => {
		setConnections((prev) => {
			const connection = prev[connectionId];
			if (!connection) {
				return prev;
			}
			const nextChatState = updater(connection.chatState);
			if (nextChatState === connection.chatState) {
				return prev;
			}
			scheduleHistorySave(
				connectionId,
				connection.settings?.host || '',
				nextChatState
			);
			return {
				...prev,
				[connectionId]: {
					...connection,
					chatState: nextChatState,
				},
			};
		});
	};

	const addStatusNote = (connectionId, text) => {
		updateChatState(connectionId, (prev) =>
			addSystemMessage(prev, STATUS_TARGET, text)
		);
	};

	const sendMessage = (connectionId, payload) => {
		const ws = wsRef.current[connectionId];
		if (!ws || ws.readyState !== READY_STATE.OPEN) {
			updateChatState(connectionId, (prev) =>
				withStatus(prev, 'error', 'Gateway is not open')
			);
			return;
		}
		if (payload?.type === 'irc_send') {
			const joinTargets = extractJoinTargets(payload.line);
			if (joinTargets.length) {
				const pending =
					pendingJoinsRef.current[connectionId] || new Set();
				joinTargets.forEach((channel) => pending.add(channel));
				pendingJoinsRef.current[connectionId] = pending;
			}
		}
		ws.send(payload);
	};

	const buildLifecycle = () =>
		createConnectionLifecycle({
			connections,
			setConnections,
			getWsRef: () => wsRef,
			getPendingJoinsRef: () => pendingJoinsRef,
			getNickRetryRef: () => nickRetryRef,
			getRejoinTargetsRef: () => rejoinTargetsRef,
			getConnectedAtRef: () => connectedAtRef,
			getOnIrcEventRef: () => onIrcEventRef,
			isBlocked,
			addStatusNote,
			updateChatState,
			sendMessage,
			createGatewayMessageHandler,
			createGatewaySocket,
			readyState: READY_STATE,
			applyHistory,
			loadHistory,
			createInitialChatState,
			withStatus,
			clearChannelUsersOnDisconnect,
			clearConnectionRefs,
			createNickRetryState,
			clearHistoryRefs,
		});

	const connect = (payload) => buildLifecycle().connect(payload);
	const disconnect = (connectionId) =>
		buildLifecycle().disconnect(connectionId);
	const close = (connectionId) => buildLifecycle().close(connectionId);

	return {
		connections,
		connect,
		disconnect,
		close,
		sendMessage,
		updateChatState,
		addStatusNote,
		flushHistorySave,
	};
};

export { useConnections };
