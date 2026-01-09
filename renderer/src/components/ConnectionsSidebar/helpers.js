const isChannelName = (name) =>
	Boolean(
		name &&
			(name.startsWith('#') ||
				name.startsWith('&') ||
				name.startsWith('+') ||
				name.startsWith('!'))
	);

const sortTargets = (targets) =>
	[...targets].sort((a, b) => {
		const aIsChannel = isChannelName(a);
		const bIsChannel = isChannelName(b);

		if (aIsChannel !== bIsChannel) {
			return aIsChannel ? -1 : 1;
		}

		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

export { isChannelName, sortTargets };
