import { STATUS_TARGET } from '../../irc/state.js';
import { createCommandHandlers } from './commandHandlers.js';

const sendParsedCommand = ({
	parsed,
	chatState,
	effectiveSettings,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	onOpenDm,
	onOpenList,
}) => {
	if (parsed.type === 'message') {
		const target = chatState.active;
		if (!target || target === STATUS_TARGET) {
			addStatusNote('Select a channel or DM before sending a message.');
			return null;
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

		return { didSend: true, shouldClear: true };
	}

	const command = parsed.command;
	const args = parsed.args;

	if (!command) {
		return null;
	}

	const target = args[0];
	const rest = args.slice(1).join(' ');

	const handlers = createCommandHandlers({
		parsed,
		chatState,
		statusTarget: STATUS_TARGET,
		effectiveSettings,
		sendMessage,
		addStatusNote,
		addOutgoingMessage,
		supportsEcho,
		onOpenDm,
		onOpenList,
	});

	const handler = handlers[command];
	if (!handler) {
		addStatusNote(`Unknown command: /${command}`);
		return { didSend: false, shouldClear: true };
	}

	return handler({ target, rest });
};

export { sendParsedCommand };
