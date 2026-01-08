import { useState, useRef, useCallback } from 'react';
import { parseInput } from '../irc/commands.js';
import { STATUS_TARGET } from '../irc/state.js';

const MAX_HISTORY = 50;

const pushHistoryEntry = (historyRef, entry) => {
	const value = entry.trim();
	if (!value) {
		return;
	}

	const history = historyRef.current;
	if (history[history.length - 1] === value) {
		return;
	}

	history.push(value);
	if (history.length > MAX_HISTORY) {
		history.shift();
	}
};

const useIrcCommands = ({
	chatState,
	effectiveSettings,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	nicknames = [],
	onOpenDm,
}) => {
	const [messageInput, setMessageInput] = useState('');
	const historyRef = useRef([]);
	const historyIndexRef = useRef(null);
	const historyDraftRef = useRef('');

	const resetHistoryNavigation = useCallback(() => {
		historyIndexRef.current = null;
		historyDraftRef.current = '';
	}, []);

	const completionRef = useRef({
		active: false,
		prefix: '',
		matches: [],
		index: -1,
		baseInput: '',
		replaceRange: null,
		lastAtStart: false,
		lastValue: '',
	});

	const resetCompletion = useCallback(() => {
		completionRef.current = {
			active: false,
			prefix: '',
			matches: [],
			index: -1,
			baseInput: '',
			replaceRange: null,
			lastAtStart: false,
			lastValue: '',
		};
	}, []);

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
		return (
			value.slice(0, range.start) + nick + suffix + value.slice(range.end)
		);
	};

	const setInputWithSelection = (input, value, cursor) => {
		setMessageInput(value);
		if (!input || typeof cursor !== 'number') {
			return;
		}
		requestAnimationFrame(() => {
			input.selectionStart = cursor;
			input.selectionEnd = cursor;
		});
	};

	const handleCompletionKeyDown = useCallback(
		(event) => {
			if (event.key !== 'Tab') {
				return false;
			}

			if (!nicknames.length) {
				return false;
			}

			event.preventDefault();

			const input = event.target;
			const value = input?.value ?? messageInput;
			const cursor =
				typeof input?.selectionStart === 'number'
					? input.selectionStart
					: value.length;

			const completion = completionRef.current;
			const isCycling =
				completion.active && completion.lastValue === value;

			let baseInput = value;
			let range = computeReplaceRange(value, cursor);
			let prefix = range ? range.word.toLowerCase() : '';
			let matches = [];

			if (isCycling) {
				baseInput = completion.baseInput;
				range = completion.replaceRange;
				prefix = completion.prefix;
				matches = completion.matches;
			} else {
				if (!range) {
					resetCompletion();
					return true;
				}
				const matcher = (nick) => nick.toLowerCase().startsWith(prefix);
				matches = nicknames.filter(matcher);
			}

			if (!matches.length || !range) {
				resetCompletion();
				return true;
			}

			let nextIndex = 0;
			if (isCycling) {
				const direction = event.shiftKey ? -1 : 1;
				nextIndex = completion.index + direction;
				if (nextIndex < 0) {
					nextIndex = matches.length - 1;
				} else if (nextIndex >= matches.length) {
					nextIndex = 0;
				}
			}

			completionRef.current = {
				active: true,
				prefix,
				matches,
				index: nextIndex,
				baseInput,
				replaceRange: range,
				lastAtStart: range.atLineStart,
				lastValue: value,
			};

			const selected = matches[nextIndex];
			const nextValue = applyCompletion(
				baseInput,
				range,
				selected,
				range.atLineStart
			);
			const nextCursor =
				range.start + selected.length + (range.atLineStart ? 2 : 1);
			completionRef.current.lastValue = nextValue;
			setInputWithSelection(input, nextValue, nextCursor);
			return true;
		},
		[messageInput, nicknames, resetCompletion]
	);

	const handleHistoryKeyDown = useCallback(
		(event) => {
			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
				return;
			}

			const history = historyRef.current;
			if (!history.length) {
				return;
			}

			event.preventDefault();

			const direction = event.key === 'ArrowUp' ? -1 : 1;
			const currentIndex = historyIndexRef.current;

			if (currentIndex === null) {
				historyDraftRef.current = messageInput;
				historyIndexRef.current = history.length - 1;
				setMessageInput(history[historyIndexRef.current]);
				return;
			}

			const nextIndex = currentIndex + direction;
			if (nextIndex < 0) {
				historyIndexRef.current = 0;
				setMessageInput(history[0]);
				return;
			}

			if (nextIndex >= history.length) {
				historyIndexRef.current = null;
				setMessageInput(historyDraftRef.current);
				return;
			}

			historyIndexRef.current = nextIndex;
			setMessageInput(history[nextIndex]);
		},
		[messageInput]
	);

	const handleSend = () => {
		const parsed = parseInput(messageInput);
		if (!parsed) {
			return;
		}

		if (!effectiveSettings.connId) {
			addStatusNote('No connection ID set.');
			return;
		}

		const rawInput = messageInput;

		if (parsed.type === 'message') {
			const target = chatState.active;
			if (!target || target === STATUS_TARGET) {
				addStatusNote(
					'Select a channel or DM before sending a message.'
				);
				return;
			}

			sendMessage({
				type: 'irc_send',
				connId: effectiveSettings.connId,
				line: `PRIVMSG ${target} :${parsed.text}`,
			});
			const isChannel = target.startsWith('#') || target.startsWith('&');
			if (!supportsEcho && !isChannel && addOutgoingMessage) {
				addOutgoingMessage(target, parsed.text, 'message');
			}
			pushHistoryEntry(historyRef, rawInput);
			resetHistoryNavigation();
			setMessageInput('');
			return;
		}

		const command = parsed.command;
		const args = parsed.args;

		if (!command) {
			return;
		}

		const target = args[0];
		const rest = args.slice(1).join(' ');

		let didSend = false;
		let shouldClear = false;

		switch (command) {
			case 'join':
				if (!target) {
					addStatusNote('Usage: /join #channel');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `JOIN ${target}`,
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'part':
				if (!target) {
					addStatusNote('Usage: /part #channel');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `PART ${target}`,
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'msg': {
				if (!target || !rest) {
					addStatusNote('Usage: /msg nick message');
					return;
				}
				const isChannel =
					target.startsWith('#') || target.startsWith('&');
				if (!isChannel && onOpenDm) {
					onOpenDm(target);
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `PRIVMSG ${target} :${rest}`,
				});
				if (!supportsEcho && addOutgoingMessage && !isChannel) {
					addOutgoingMessage(target, rest, 'message');
				}
				didSend = true;
				shouldClear = true;
				break;
			}
			case 'query': {
				if (!target) {
					addStatusNote('Usage: /query nick [message]');
					return;
				}
				const isChannel =
					target.startsWith('#') || target.startsWith('&');
				if (!isChannel && onOpenDm) {
					onOpenDm(target);
				}
				if (rest) {
					sendMessage({
						type: 'irc_send',
						connId: effectiveSettings.connId,
						line: `PRIVMSG ${target} :${rest}`,
					});
					if (!supportsEcho && addOutgoingMessage && !isChannel) {
						addOutgoingMessage(target, rest, 'message');
					}
					didSend = true;
				}
				shouldClear = true;
				break;
			}
			case 'me': {
				if (!rest) {
					addStatusNote('Usage: /me action');
					return;
				}
				if (!chatState.active || chatState.active === STATUS_TARGET) {
					addStatusNote('Select a channel or DM before using /me.');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `PRIVMSG ${chatState.active} :\u0001ACTION ${rest}\u0001`,
				});
				const isChannel =
					chatState.active.startsWith('#') ||
					chatState.active.startsWith('&');
				if (!supportsEcho && !isChannel && addOutgoingMessage) {
					addOutgoingMessage(chatState.active, rest, 'action');
				}
				didSend = true;
				shouldClear = true;
				break;
			}
			case 'nick':
				if (!target) {
					addStatusNote('Usage: /nick newNick');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `NICK ${target}`,
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'topic':
				if (!target) {
					addStatusNote('Usage: /topic #channel topic');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `TOPIC ${target} :${rest}`,
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'mode':
				if (!target) {
					addStatusNote('Usage: /mode #channel +m');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `MODE ${target} ${rest}`,
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'whois':
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `WHOIS ${target || ''}`.trim(),
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'who':
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: `WHO ${target || ''}`.trim(),
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'list':
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: 'LIST',
				});
				didSend = true;
				shouldClear = true;
				break;
			case 'raw':
			case 'quote':
				if (!parsed.raw) {
					addStatusNote('Usage: /raw IRC_LINE');
					return;
				}
				sendMessage({
					type: 'irc_send',
					connId: effectiveSettings.connId,
					line: parsed.raw,
				});
				didSend = true;
				shouldClear = true;
				break;
			default:
				addStatusNote(`Unknown command: /${command}`);
				shouldClear = true;
		}

		if (shouldClear) {
			if (didSend) {
				pushHistoryEntry(historyRef, rawInput);
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
