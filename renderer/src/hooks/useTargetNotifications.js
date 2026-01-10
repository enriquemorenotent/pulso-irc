import { useCallback, useEffect, useState } from 'react';
import {
	loadTargetNotifications,
	persistTargetNotifications,
	isTargetNotified as getIsTargetNotified,
	setTargetNotified as setTargetNotifiedState,
	renameTargetNotified as renameTargetNotifiedState,
} from '../irc/target_notifications.js';

const useTargetNotifications = () => {
	const [store, setStore] = useState(() => loadTargetNotifications());

	useEffect(() => {
		persistTargetNotifications(store);
	}, [store]);

	const isTargetNotified = useCallback(
		(connectionId, targetName) =>
			getIsTargetNotified(store, connectionId, targetName),
		[store]
	);

	const setTargetNotified = useCallback(
		(connectionId, targetName, enabled) => {
			setStore((prev) =>
				setTargetNotifiedState(
					prev,
					connectionId,
					targetName,
					Boolean(enabled)
				)
			);
		},
		[]
	);

	const renameTargetNotified = useCallback((connectionId, oldName, newName) => {
		setStore((prev) =>
			renameTargetNotifiedState(prev, connectionId, oldName, newName)
		);
	}, []);

	return { isTargetNotified, setTargetNotified, renameTargetNotified };
};

export { useTargetNotifications };
