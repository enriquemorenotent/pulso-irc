const MAX_NICK_RETRIES = 6;
const HISTORY_GRACE_MS = 30000;
const HISTORY_SUPPRESSED_COMMANDS = new Set([
	'PRIVMSG',
	'NOTICE',
	'JOIN',
	'PART',
	'QUIT',
	'NICK',
	'MODE',
	'KICK',
	'INVITE',
	'ACCOUNT',
	'CHGHOST',
]);

const extractJoinTargets = (line) => {
	if (!line || typeof line !== 'string') {
		return [];
	}

	const trimmed = line.trim();
	if (!trimmed) {
		return [];
	}

	const [command, rest = ''] = trimmed.split(/\s+/, 2);
	if (!command || command.toUpperCase() !== 'JOIN') {
		return [];
	}

	const [channelsPart] = rest.split(/\s+/);
	if (!channelsPart) {
		return [];
	}

	return channelsPart
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
};

const shouldSuppressHistory = (event, connectedAt) => {
	if (!event || !connectedAt) {
		return false;
	}

	const tags = event.tags || {};

	if (tags.batch) {
		return true;
	}

	if (typeof tags.time === 'string') {
		const parsed = Date.parse(tags.time);
		if (!Number.isNaN(parsed) && parsed < connectedAt - HISTORY_GRACE_MS) {
			return true;
		}
	}

	return false;
};

const buildNickCandidate = (baseNick, attempt) => {
	if (!baseNick) {
		return '';
	}

	if (attempt <= 3) {
		return `${baseNick}${'_'.repeat(attempt)}`;
	}

	return `${baseNick}${attempt - 3}`;
};

const createNickRetryState = (baseNick, active = true) => ({
	baseNick,
	attempt: 0,
	lastNick: baseNick,
	active,
});

export {
	MAX_NICK_RETRIES,
	HISTORY_SUPPRESSED_COMMANDS,
	extractJoinTargets,
	shouldSuppressHistory,
	buildNickCandidate,
	createNickRetryState,
};
