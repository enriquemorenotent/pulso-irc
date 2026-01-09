const computeReplaceRange = (value, cursor) => {
	const beforeCursor = value.slice(0, cursor);
	const match = beforeCursor.match(/(^|\s)(\S+)$/);
	if (!match) {
		return null;
	}
	const word = match[2];
	const start = beforeCursor.length - word.length;
	return {
		start,
		end: cursor,
		word,
		atLineStart: start === 0,
	};
};

const applyCompletion = (value, range, nick, atLineStart) => {
	const suffix = atLineStart ? ': ' : ' ';
	return value.slice(0, range.start) + nick + suffix + value.slice(range.end);
};

export { computeReplaceRange, applyCompletion };
