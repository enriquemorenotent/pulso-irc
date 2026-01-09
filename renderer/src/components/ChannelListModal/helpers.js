const formatUserCount = (count) => {
	if (typeof count !== 'number' || Number.isNaN(count)) {
		return 'n/a';
	}
	return count.toLocaleString();
};

const compareNames = (a, b) => {
	const nameA = String(a.channel || '').toLowerCase();
	const nameB = String(b.channel || '').toLowerCase();
	return nameA.localeCompare(nameB);
};

const getUserCountValue = (item) => {
	const value = item?.users;
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return null;
	}
	return value;
};

const sortChannels = (items, sortKey, sortDirection) => {
	const sorted = items.slice();
	return sorted.sort((a, b) => {
		if (sortKey === 'users') {
			const countA = getUserCountValue(a);
			const countB = getUserCountValue(b);
			if (countA === null && countB === null) {
				return compareNames(a, b);
			}
			if (countA === null) {
				return 1;
			}
			if (countB === null) {
				return -1;
			}
			const diff = countA - countB;
			if (diff !== 0) {
				return sortDirection === 'asc' ? diff : -diff;
			}
			return compareNames(a, b);
		}

		const diff = compareNames(a, b);
		return sortDirection === 'asc' ? diff : -diff;
	});
};

export { formatUserCount, sortChannels };
