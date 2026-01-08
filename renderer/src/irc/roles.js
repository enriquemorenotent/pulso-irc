const ROLE_BADGES = {
	'~': {
		label: 'Owner',
		text: 'owner',
		className:
			'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
	},
	'&': {
		label: 'Admin',
		text: 'admin',
		className:
			'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
	},
	'@': {
		label: 'Op',
		text: 'operator',
		className:
			'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
	},
	'%': {
		label: 'Half-op',
		text: 'half-op',
		className:
			'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
	},
	'+': {
		label: 'Voice',
		text: 'voice',
		className:
			'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-300',
	},
};

const ROLE_ORDER = ['~', '&', '@', '%', '+'];

const ROLE_MODE_MAP = {
	q: '~',
	a: '&',
	o: '@',
	h: '%',
	v: '+',
};

const DEFAULT_ROLE_BADGE_CLASSNAME =
	'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-300';

const getHighestRoleSymbol = (prefix) => {
	if (!prefix) {
		return null;
	}

	let bestSymbol = null;
	let bestWeight = Number.POSITIVE_INFINITY;

	prefix.split('').forEach((symbol) => {
		const weight = ROLE_ORDER.indexOf(symbol);
		if (weight !== -1 && weight < bestWeight) {
			bestWeight = weight;
			bestSymbol = symbol;
		}
	});

	return bestSymbol || prefix[0];
};

const getRoleBadge = (symbol) => ROLE_BADGES[symbol] || null;

const getRoleLabel = (symbol) => getRoleBadge(symbol)?.label || symbol;

const getRoleText = (symbol) => {
	const badgeText = getRoleBadge(symbol)?.text;
	if (badgeText) {
		return badgeText;
	}

	const label = getRoleLabel(symbol);
	if (typeof label === 'string') {
		return label.toLowerCase();
	}

	return String(label || '').toLowerCase();
};

export {
	DEFAULT_ROLE_BADGE_CLASSNAME,
	ROLE_BADGES,
	ROLE_MODE_MAP,
	ROLE_ORDER,
	getHighestRoleSymbol,
	getRoleBadge,
	getRoleLabel,
	getRoleText,
};
