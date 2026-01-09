import { persistHistory } from '../../irc/history.js';

const createHistoryManager = ({ getHistorySaveRef, getHistoryPendingRef }) => {
	const scheduleHistorySave = (connectionId, host, chatState) => {
		if (!connectionId || !chatState) {
			return;
		}

		const historySaveRef = getHistorySaveRef();
		const historyPendingRef = getHistoryPendingRef();
		historyPendingRef.current[connectionId] = { host, chatState };

		if (historySaveRef.current[connectionId]) {
			return;
		}

		historySaveRef.current[connectionId] = setTimeout(() => {
			historySaveRef.current[connectionId] = null;
			const pending = historyPendingRef.current[connectionId];
			if (pending) {
				persistHistory(connectionId, pending.host, pending.chatState);
			}
		}, 250);
	};

	const flushHistorySave = (connectionId) => {
		if (!connectionId) {
			return;
		}

		const historySaveRef = getHistorySaveRef();
		const historyPendingRef = getHistoryPendingRef();
		if (historySaveRef.current[connectionId]) {
			clearTimeout(historySaveRef.current[connectionId]);
			historySaveRef.current[connectionId] = null;
		}

		const pending = historyPendingRef.current[connectionId];
		if (pending) {
			persistHistory(connectionId, pending.host, pending.chatState);
			delete historyPendingRef.current[connectionId];
		}
	};

	const clearHistoryRefs = (connectionId) => {
		const historySaveRef = getHistorySaveRef();
		const historyPendingRef = getHistoryPendingRef();
		delete historyPendingRef.current[connectionId];
		if (historySaveRef.current[connectionId]) {
			clearTimeout(historySaveRef.current[connectionId]);
			historySaveRef.current[connectionId] = null;
		}
	};

	return { scheduleHistorySave, flushHistorySave, clearHistoryRefs };
};

export { createHistoryManager };
