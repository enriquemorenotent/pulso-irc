const clearConnectionRefs = ({
	connectionId,
	pendingJoinsRef,
	nickRetryRef,
	rejoinTargetsRef,
	connectedAtRef,
	clearHistoryRefs,
}) => {
	delete pendingJoinsRef.current[connectionId];
	delete nickRetryRef.current[connectionId];
	if (rejoinTargetsRef) {
		delete rejoinTargetsRef.current[connectionId];
	}
	delete connectedAtRef.current[connectionId];
	clearHistoryRefs(connectionId);
};

export { clearConnectionRefs };
