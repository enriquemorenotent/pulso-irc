import {
	DEFAULT_ROLE_BADGE_CLASSNAME,
	getHighestRoleSymbol,
	getRoleBadge,
} from '../irc/roles.js';

const RoleBadge = ({ prefix = '', symbol = '', className = '' }) => {
	const resolvedSymbol = symbol || getHighestRoleSymbol(prefix);
	if (!resolvedSymbol) {
		return null;
	}

	const badge = getRoleBadge(resolvedSymbol);
	const label = badge?.label || resolvedSymbol;
	const badgeClassName = badge?.className || DEFAULT_ROLE_BADGE_CLASSNAME;
	const classes = [
		'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
		badgeClassName,
		className,
	]
		.filter(Boolean)
		.join(' ');

	return <span className={classes}>{label}</span>;
};

export { RoleBadge };
