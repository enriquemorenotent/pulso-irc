const getDisplayTime = (value) => {
	if (!value) {
		return '';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return date.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
};

const MessageTimestamp = ({ time }) => (
	<div className="w-12.5 shrink-0 text-right font-mono text-xs text-neutral-400 select-none dark:text-neutral-500">
		{getDisplayTime(time)}
	</div>
);

export { MessageTimestamp };
