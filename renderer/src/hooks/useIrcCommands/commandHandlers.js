const isChannelTarget = (target) =>
	Boolean(target && (target.startsWith('#') || target.startsWith('&')));

const createCommandHandlers = ({
	parsed,
	chatState,
	statusTarget,
	effectiveSettings,
	sendMessage,
	addStatusNote,
	addOutgoingMessage,
	supportsEcho,
	onOpenDm,
	onOpenList,
}) => {
	const sendIrc = (line) =>
		sendMessage({
			type: 'irc_send',
			connId: effectiveSettings.connId,
			line,
		});

	const maybeEcho = (target, text, type) => {
		if (!supportsEcho && addOutgoingMessage && !isChannelTarget(target)) {
			addOutgoingMessage(target, text, type);
		}
	};

	return {
		join: ({ target }) => {
			if (!target) {
				addStatusNote('Usage: /join #channel');
				return null;
			}
			sendIrc(`JOIN ${target}`);
			return { didSend: true, shouldClear: true };
		},
		part: ({ target }) => {
			if (!target) {
				addStatusNote('Usage: /part #channel');
				return null;
			}
			sendIrc(`PART ${target}`);
			return { didSend: true, shouldClear: true };
		},
		msg: ({ target, rest }) => {
			if (!target || !rest) {
				addStatusNote('Usage: /msg nick message');
				return null;
			}
			if (!isChannelTarget(target) && onOpenDm) {
				onOpenDm(target);
			}
			sendIrc(`PRIVMSG ${target} :${rest}`);
			maybeEcho(target, rest, 'message');
			return { didSend: true, shouldClear: true };
		},
		query: ({ target, rest }) => {
			if (!target) {
				addStatusNote('Usage: /query nick [message]');
				return null;
			}
			if (!isChannelTarget(target) && onOpenDm) {
				onOpenDm(target);
			}
			if (rest) {
				sendIrc(`PRIVMSG ${target} :${rest}`);
				maybeEcho(target, rest, 'message');
			}
			return { didSend: Boolean(rest), shouldClear: true };
		},
		me: ({ rest }) => {
			if (!rest) {
				addStatusNote('Usage: /me action');
				return null;
			}
			if (!chatState.active || chatState.active === statusTarget) {
				addStatusNote('Select a channel or DM before using /me.');
				return null;
			}
			sendIrc(
				`PRIVMSG ${chatState.active} :\u0001ACTION ${rest}\u0001`
			);
			maybeEcho(chatState.active, rest, 'action');
			return { didSend: true, shouldClear: true };
		},
		nick: ({ target }) => {
			if (!target) {
				addStatusNote('Usage: /nick newNick');
				return null;
			}
			sendIrc(`NICK ${target}`);
			return { didSend: true, shouldClear: true };
		},
		topic: ({ target, rest }) => {
			if (!target) {
				addStatusNote('Usage: /topic #channel topic');
				return null;
			}
			sendIrc(`TOPIC ${target} :${rest}`);
			return { didSend: true, shouldClear: true };
		},
		mode: ({ target, rest }) => {
			if (!target) {
				addStatusNote('Usage: /mode #channel +m');
				return null;
			}
			sendIrc(`MODE ${target} ${rest}`);
			return { didSend: true, shouldClear: true };
		},
		whois: ({ target }) => {
			sendIrc(`WHOIS ${target || ''}`.trim());
			return { didSend: true, shouldClear: true };
		},
		who: ({ target }) => {
			sendIrc(`WHO ${target || ''}`.trim());
			return { didSend: true, shouldClear: true };
		},
		list: () => {
			if (onOpenList) {
				onOpenList();
			}
			sendIrc('LIST');
			return { didSend: true, shouldClear: true };
		},
		raw: () => {
			if (!parsed.raw) {
				addStatusNote('Usage: /raw IRC_LINE');
				return null;
			}
			sendIrc(parsed.raw);
			return { didSend: true, shouldClear: true };
		},
		quote: () => {
			if (!parsed.raw) {
				addStatusNote('Usage: /raw IRC_LINE');
				return null;
			}
			sendIrc(parsed.raw);
			return { didSend: true, shouldClear: true };
		},
	};
};

export { createCommandHandlers };
