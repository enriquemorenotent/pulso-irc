const isChannelName = (name) =>
	Boolean(name) && (name.startsWith('#') || name.startsWith('&'));

const withStatus = (state, status, error = '') => ({
	...state,
	status,
	error,
});

export { isChannelName, withStatus };
