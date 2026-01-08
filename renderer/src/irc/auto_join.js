const splitAutoJoin = (value) => {
	if (!value) {
		return [];
	}

	return String(value)
		.split(/[, ]+/)
		.map((entry) => entry.trim())
		.filter(Boolean);
};

const normalizeChannelKey = (value) => {
	if (!value) {
		return '';
	}

	return String(value).trim().toLowerCase();
};

const isAutoJoinEnabled = (value, channel) => {
	const key = normalizeChannelKey(channel);
	if (!key) {
		return false;
	}

	return splitAutoJoin(value).some(
		(entry) => normalizeChannelKey(entry) === key
	);
};

const toggleAutoJoin = (value, channel) => {
	const list = splitAutoJoin(value);
	const key = normalizeChannelKey(channel);
	if (!key) {
		return value || '';
	}

	const exists = list.some((entry) => normalizeChannelKey(entry) === key);
	const nextList = exists
		? list.filter((entry) => normalizeChannelKey(entry) !== key)
		: [...list, String(channel).trim()];

	return nextList.join(', ');
};

export { isAutoJoinEnabled, splitAutoJoin, toggleAutoJoin };
