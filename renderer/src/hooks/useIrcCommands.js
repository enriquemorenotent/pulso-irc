import { useState, useCallback } from 'react';
import { parseInput } from '../irc/commands.js';
import { pushHistoryEntry } from './useIrcCommands/history.js';
import { sendParsedCommand } from './useIrcCommands/commandHandler.js';
import { useCompletion } from './useIrcCommands/useCompletion.js';
import { useHistoryNavigation } from './useIrcCommands/useHistoryNavigation.js';

const useIrcCommands = ({
	chatState,
	effectiveSettings,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	nicknames = [],
	onOpenDm,
	onOpenList,
}) => {
	const [messageInput, setMessageInput] = useState('');
	const { historyRef, resetHistoryNavigation, handleHistoryKeyDown } =
		useHistoryNavigation({ messageInput, setMessageInput });
	const { handleCompletionKeyDown, resetCompletion } = useCompletion({
		nicknames,
		messageInput,
		setMessageInput,
	});

	const handleSend = () => {
		if (chatState.status !== 'connected') {
			addStatusNote('Not connected.');
			return;
		}
		const parsed = parseInput(messageInput);
		if (!parsed) {
			return;
		}

		if (!effectiveSettings.connId) {
			addStatusNote('No connection ID set.');
			return;
		}

		const outcome = sendParsedCommand({
			parsed,
			chatState,
			effectiveSettings,
			sendMessage,
			addStatusNote,
			addOutgoingMessage,
			supportsEcho,
			onOpenDm,
			onOpenList,
		});
		if (!outcome) {
			return;
		}

		if (outcome.shouldClear) {
			if (outcome.didSend) {
				pushHistoryEntry(historyRef, messageInput);
			}
			resetHistoryNavigation();
			setMessageInput('');
		}
	};

	const handleInputKeyDown = useCallback(
		(event) => {
			if (handleCompletionKeyDown(event)) {
				return;
			}
			handleHistoryKeyDown(event);
		},
		[handleCompletionKeyDown, handleHistoryKeyDown]
	);

	const handleInputChange = useCallback(
		(event) => {
			resetHistoryNavigation();
			resetCompletion();
			setMessageInput(event.target.value);
		},
		[resetCompletion, resetHistoryNavigation]
	);

	return {
		messageInput,
		setMessageInput,
		handleSend,
		handleInputKeyDown,
		handleInputChange,
	};
};

export { useIrcCommands };
