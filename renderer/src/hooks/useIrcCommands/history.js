const MAX_HISTORY = 50;

const pushHistoryEntry = (historyRef, entry) => {
	const value = entry.trim();
	if (!value) {
		return;
	}

	const history = historyRef.current;
	if (history[history.length - 1] === value) {
		return;
	}

	history.push(value);
	if (history.length > MAX_HISTORY) {
		history.shift();
	}
};

export { MAX_HISTORY, pushHistoryEntry };
