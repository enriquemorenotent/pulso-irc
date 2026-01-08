const formatIdle = (seconds) => {
	if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
		return '';
	}
	const mins = Math.floor(seconds / 60);
	const hours = Math.floor(mins / 60);
	const days = Math.floor(hours / 24);
	const parts = [];
	if (days) parts.push(`${days}d`);
	if (hours % 24) parts.push(`${hours % 24}h`);
	if (mins % 60) parts.push(`${mins % 60}m`);
	if (!parts.length) parts.push(`${seconds}s`);
	return parts.join(' ');
};

const formatSignon = (timestamp) => {
	if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
		return '';
	}
	return new Date(timestamp * 1000).toLocaleString();
};

const InfoRow = ({ label, value }) => {
	if (!value) {
		return null;
	}
	return (
		<div className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
			<span className="w-24 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
				{label}
			</span>
			<span className="text-sm text-neutral-700 dark:text-neutral-200 break-words">
				{value}
			</span>
		</div>
	);
};

const WhoisModal = ({ whois }) => {
	if (!whois) {
		return null;
	}

	const { status, error, data, nick } = whois;
	const channels =
		Array.isArray(data?.channels) && data.channels.length
			? data.channels.join(' ')
			: '';
	const idle = formatIdle(data?.idleSeconds);
	const signon = formatSignon(data?.signonTime);
	const extra = Array.isArray(data?.extra) ? data.extra : [];

	return (
		<div className="p-6">
			{status === 'loading' && (
				<p className="text-sm text-neutral-500 dark:text-neutral-400">
					Looking up {nick}...
				</p>
			)}
			{status === 'error' && (
				<p className="text-sm text-red-600 dark:text-red-400">
					{error || 'WHOIS failed.'}
				</p>
			)}
			{status !== 'error' && (
				<div className="space-y-1">
					<InfoRow label="Nick" value={data?.nick || nick} />
					<InfoRow label="User" value={data?.user} />
					<InfoRow label="Host" value={data?.host} />
					<InfoRow label="Real name" value={data?.realname} />
					<InfoRow label="Server" value={data?.server} />
					<InfoRow label="Server info" value={data?.serverInfo} />
					<InfoRow label="Account" value={data?.account} />
					<InfoRow label="Channels" value={channels} />
					<InfoRow label="Away" value={data?.away} />
					<InfoRow label="Idle" value={idle} />
					<InfoRow label="Signon" value={signon} />
					{data?.operator && (
						<InfoRow label="Operator" value="Yes" />
					)}
					{data?.secure && (
						<InfoRow label="Secure" value="Yes" />
					)}
					{data?.registered && (
						<InfoRow label="Registered" value="Yes" />
					)}
					{extra.length > 0 && (
						<div className="pt-2">
							<div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
								Additional
							</div>
							<ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
								{extra.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export { WhoisModal };
