import { Send } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { STATUS_TARGET } from '../../irc/state.js';
import { useIrcCommands } from '../../hooks/useIrcCommands.js';

const MessageComposer = ({
	activeTarget,
	chatState,
	isConnected,
	effectiveSettings,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	nicknames,
	onOpenDm,
	onOpenList,
}) => {
	const inputRef = useRef(null);
	const {
		messageInput,
		setMessageInput,
		handleSend,
		handleInputKeyDown,
		handleInputChange,
	} = useIrcCommands({
		chatState,
		effectiveSettings,
		sendMessage,
		addStatusNote,
		addOutgoingMessage,
		supportsEcho,
		nicknames,
		onOpenDm,
		onOpenList,
	});

	useEffect(() => {
		if (inputRef.current && isConnected) {
			inputRef.current.focus();
		}
	}, [activeTarget.name, isConnected]);

	return (
		<div className="border-t border-neutral-200 p-3 bg-neutral-50/80 dark:bg-neutral-900/80 dark:border-neutral-800">
			<div className="relative flex gap-2">
				<input
					ref={inputRef}
					className="flex-1 min-w-0 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:ring-neutral-700 dark:focus:border-neutral-600"
					value={messageInput}
					disabled={!isConnected}
					onChange={(event) => {
						if (handleInputChange) {
							handleInputChange(event);
							return;
						}
						setMessageInput(event.target.value);
					}}
					onKeyDown={(event) => {
						if (!isConnected) {
							return;
						}
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							handleSend();
							return;
						}
						if (handleInputKeyDown) {
							handleInputKeyDown(event);
						}
					}}
					placeholder={
						!isConnected
							? 'Disconnected'
							: chatState.active === STATUS_TARGET
							? 'Type /join #channel...'
							: `Message ${activeTarget.name}...`
					}
					autoFocus
				/>
				<button
					type="button"
					onClick={() => {
						if (!isConnected) {
							return;
						}
						handleSend();
					}}
					disabled={!isConnected || !messageInput.trim()}
					className="rounded-lg bg-neutral-800 p-2.5 text-white hover:bg-neutral-700 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-500 dark:bg-neutral-600 dark:hover:bg-neutral-500"
					aria-label="Send message"
				>
					<Send className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

export { MessageComposer };
