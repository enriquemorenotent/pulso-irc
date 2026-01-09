import { useRef, useCallback } from 'react';
import { applyCompletion, computeReplaceRange } from './completion.js';

const useCompletion = ({ nicknames, messageInput, setMessageInput }) => {
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

	const setInputWithSelection = useCallback(
		(input, value, cursor) => {
			setMessageInput(value);
			if (!input || typeof cursor !== 'number') {
				return;
			}
			requestAnimationFrame(() => {
				input.selectionStart = cursor;
				input.selectionEnd = cursor;
			});
		},
		[setMessageInput]
	);

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
		[messageInput, nicknames, resetCompletion, setInputWithSelection]
	);

	return { handleCompletionKeyDown, resetCompletion };
};

export { useCompletion };
