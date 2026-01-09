import { STATUS_TARGET } from '../constants.js';
import { createId } from '../factories.js';
import { addSystemMessage, appendMessage } from '../messages.js';
import {
	removeTarget,
	renameTarget,
	setActiveTarget,
	updateTarget,
} from '../targets.js';
import { getUserKey, renameUser, removeUser, updateUsers } from '../users.js';

const handleMembershipEvent = (state, event) => {
	if (!event) {
		return null;
	}

	const { command, prefix, params, target, serverTime } = event;
	const me = state.me;
	const timestamp = serverTime || new Date().toISOString();

	if (command === 'JOIN') {
		const channel = target || params[0];
		const nick = prefix?.nick || '';
		const next = appendMessage(
			state,
			channel,
			{
				id: createId(),
				time: timestamp,
				type: 'join',
				text: nick === me ? 'You joined' : `${nick} joined`,
			},
			'channel',
			{ incrementUnread: false }
		);

		const updated = updateTarget(next, channel, (targetData) => {
			const updates = nick
				? [{ nick, prefix: targetData.users[nick] || '' }]
				: [];
			return updateUsers({ ...targetData, joined: true }, updates);
		});

		if (nick === me) {
			const withResetFlag = updateTarget(
				updated,
				channel,
				(targetData) => ({
					...targetData,
					namesReceived: false,
				})
			);
			return setActiveTarget(withResetFlag, channel, 'channel');
		}

		return updated;
	}

	if (command === 'PART') {
		const channel = target || params[0];
		const nick = prefix?.nick || '';
		if (nick === me && channel) {
			const withoutChannel = removeTarget(state, channel);
			return addSystemMessage(
				withoutChannel,
				STATUS_TARGET,
				`You left ${channel}`
			);
		}

		const updated = appendMessage(
			state,
			channel,
			{
				id: createId(),
				time: timestamp,
				type: 'part',
				text: `${nick} left`,
			},
			'channel',
			{ incrementUnread: false }
		);

		return updateTarget(updated, channel, (targetData) =>
			removeUser(targetData, nick)
		);
	}

	if (command === 'QUIT') {
		const nick = prefix?.nick || '';
		const reason = params[0] || '';
		if (!nick) {
			return state;
		}
		let nextState = state;
		let quitReported = false;

		state.order.forEach((name) => {
			const targetData = nextState.targets[name];
			if (targetData.type !== 'channel') {
				return;
			}
			if (!getUserKey(targetData.users, nick)) {
				return;
			}

			nextState = appendMessage(
				nextState,
				name,
				{
					id: createId(),
					time: timestamp,
					type: 'quit',
					text: `${nick} quit (${reason})`
						.trim()
						.replace(/\(\)$/, ''),
				},
				'channel',
				{ incrementUnread: false }
			);
			quitReported = true;

			nextState = updateTarget(nextState, name, (data) =>
				removeUser(data, nick)
			);
		});

		return quitReported ? nextState : state;
	}

	if (command === 'NICK') {
		const oldNick = prefix?.nick || prefix?.server || '';
		const newNick = params[0] || '';
		if (!oldNick || !newNick || oldNick === newNick) {
			return state;
		}

		const messageText = `${oldNick} is now known as ${newNick}`;
		const isSelfChange =
			me && oldNick.toLowerCase() === me.toLowerCase();
		let nextState = state;
		state.order.forEach((name) => {
			const targetData = nextState.targets[name];
			if (targetData.type !== 'channel') {
				return;
			}
			const hasNick = Boolean(getUserKey(targetData.users, oldNick));
			if (!hasNick && !(isSelfChange && targetData.joined)) {
				return;
			}

			nextState = appendMessage(
				nextState,
				name,
				{
					id: createId(),
					time: timestamp,
					type: 'nick',
					text: messageText,
				},
				'channel',
				{ incrementUnread: false }
			);
			nextState = updateTarget(nextState, name, (data) =>
				renameUser(data, oldNick, newNick)
			);
		});

		nextState = appendMessage(
			nextState,
			STATUS_TARGET,
			{
				id: createId(),
				time: timestamp,
				type: 'nick',
				text: messageText,
			},
			'status',
			{ incrementUnread: false }
		);

		nextState = renameTarget(nextState, oldNick, newNick);

		if (isSelfChange) {
			nextState = {
				...nextState,
				me: newNick,
			};
		}

		return nextState;
	}

	return null;
};

export { handleMembershipEvent };
