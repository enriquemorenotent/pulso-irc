import { ROLE_MODE_MAP, getRoleText } from '../../roles.js';

const buildRoleModeText = ({ action, symbol, nick }) => {
	const actionText = action === 'add' ? 'gained' : 'lost';
	const roleText = symbol ? getRoleText(symbol) : '';
	return `${nick} ${actionText} ${roleText}`.trim();
};

const parseRoleModeChanges = (modeString, modeParams = []) => {
	if (!modeString || typeof modeString !== 'string') {
		return { ok: false, changes: [] };
	}

	let sign = null;
	let paramIndex = 0;
	const changes = [];

	for (const char of modeString) {
		if (char === '+' || char === '-') {
			sign = char;
			continue;
		}

		const symbol = ROLE_MODE_MAP[char];
		if (!symbol || !sign) {
			return { ok: false, changes: [] };
		}

		const nick = modeParams[paramIndex];
		if (!nick) {
			return { ok: false, changes: [] };
		}

		changes.push({
			action: sign === '+' ? 'add' : 'remove',
			symbol,
			nick,
		});
		paramIndex += 1;
	}

	if (paramIndex !== modeParams.length) {
		return { ok: false, changes: [] };
	}

	return { ok: changes.length > 0, changes };
};

const findSingleChannelForNick = (state, nick) => {
	if (!nick) {
		return null;
	}

	const matches = state.order.filter((name) => {
		const target = state.targets[name];
		return target?.type === 'channel' && target.users?.[nick];
	});

	return matches.length === 1 ? matches[0] : null;
};

export { buildRoleModeText, parseRoleModeChanges, findSingleChannelForNick };
