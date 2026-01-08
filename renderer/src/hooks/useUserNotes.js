import { useCallback, useEffect, useState } from 'react';
import {
	getNote,
	loadNotesStore,
	persistNotesStore,
	setNote,
} from '../irc/notes.js';

const useUserNotes = () => {
	const [notesStore, setNotesStore] = useState(() => loadNotesStore());

	useEffect(() => {
		persistNotesStore(notesStore);
	}, [notesStore]);

	const getUserNote = useCallback(
		(connectionId, nick) => getNote(notesStore, connectionId, nick),
		[notesStore]
	);

	const setUserNote = useCallback((connectionId, nick, note) => {
		setNotesStore((prev) => setNote(prev, connectionId, nick, note));
	}, []);

	return {
		getUserNote,
		setUserNote,
	};
};

export { useUserNotes };
