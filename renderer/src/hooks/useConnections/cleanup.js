const clearConnectionRefs = ({
	connectionId,
	pendingJoinsRef,
	nickRetryRef,
	connectedAtRef,
	clearHistoryRefs,
}) => {
	delete pendingJoinsRef.current[connectionId];
	delete nickRetryRef.current[connectionId];
	delete connectedAtRef.current[connectionId];
	clearHistoryRefs(connectionId);
};

export { clearConnectionRefs };
