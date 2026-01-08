const statusMeta = {
	checking: {
		label: 'Checking...',
		tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
		dot: 'bg-amber-400',
	},
	reachable: {
		label: 'Online',
		tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
		dot: 'bg-emerald-400',
	},
	unreachable: {
		label: 'Offline',
		tone: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
		dot: 'bg-rose-400',
	},
	idle: {
		label: 'Unknown',
		tone: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
		dot: 'bg-neutral-400',
	},
};

const HeaderBar = ({
	backLabel,
	onBack,
	onConnectServer,
	onManageProfiles,
	onManageFriends,
	onManageBlocklist,
	onManageSettings,
	activeView,
	darkMode,
	onToggleDarkMode,
	gatewayStatus,
	gatewayError,
	onCheckGateway,
}) => {
	const secondaryButton =
		'flex items-center gap-1.5 rounded-lg bg-white border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-800 hover:border-neutral-300 cursor-pointer dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white dark:hover:border-neutral-600';
	const primaryButton =
		'flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-neutral-700 cursor-pointer dark:bg-neutral-600 dark:hover:bg-neutral-500';
	const activeButton =
		'flex items-center gap-1.5 rounded-lg bg-neutral-200 border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-all cursor-pointer dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100';

	const statusInfo = statusMeta[gatewayStatus] || statusMeta.idle;

	return (
		<header className="flex flex-col gap-4 border-b border-neutral-200 bg-white px-6 py-4 md:flex-row md:items-center md:justify-between sticky top-0 z-20 dark:bg-neutral-900 dark:border-neutral-800">
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-600 text-white shadow-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z" />
						<path d="m9 12 2 2 4-4" />
					</svg>
				</div>
				<div>
					<h1 className="text-lg font-bold text-neutral-900 leading-none tracking-tight dark:text-white">
						Pulso IRC
					</h1>
				</div>

				<div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-neutral-200 dark:border-neutral-700">
					<div className="group relative">
						<button
							type="button"
							onClick={onCheckGateway}
							className={`flex items-center gap-2 px-2.5 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer ${statusInfo.tone}`}
							title={gatewayError || 'Local engine status'}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${
									statusInfo.dot
								} ${
									gatewayStatus === 'checking'
										? 'animate-pulse'
										: ''
								}`}
							/>
							<span>Engine {statusInfo.label}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-3 h-3 opacity-60"
							>
								<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
								<path d="M3 3v5h5" />
								<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
								<path d="M16 21h5v-5" />
							</svg>
						</button>
						{gatewayError && (
							<div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 dark:bg-neutral-800 dark:border-neutral-700">
								<p className="text-[10px] font-bold uppercase text-rose-400 mb-1">
									Error
								</p>
								<p className="text-xs text-rose-600 dark:text-rose-400">
									{gatewayError}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={onToggleDarkMode}
					className={secondaryButton}
					title={
						darkMode
							? 'Switch to Light Mode'
							: 'Switch to Dark Mode'
					}
				>
					{darkMode ? (
						<>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="12" cy="12" r="5" />
								<line x1="12" y1="1" x2="12" y2="3" />
								<line x1="12" y1="21" x2="12" y2="23" />
								<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
								<line
									x1="18.36"
									y1="18.36"
									x2="19.78"
									y2="19.78"
								/>
								<line x1="1" y1="12" x2="3" y2="12" />
								<line x1="21" y1="12" x2="23" y2="12" />
								<line
									x1="4.22"
									y1="19.78"
									x2="5.64"
									y2="18.36"
								/>
								<line
									x1="18.36"
									y1="5.64"
									x2="19.78"
									y2="4.22"
								/>
							</svg>
							<span className="hidden sm:inline">Light</span>
						</>
					) : (
						<>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
							</svg>
							<span className="hidden sm:inline">Dark</span>
						</>
					)}
				</button>
				{onBack ? (
					<button
						type="button"
						onClick={onBack}
						className={secondaryButton}
					>
						{backLabel}
					</button>
				) : null}
				{onConnectServer ? (
					<button
						type="button"
						onClick={onConnectServer}
						className={
							activeView === 'connect'
								? activeButton
								: primaryButton
						}
					>
						New Connection
					</button>
				) : null}
				{onManageProfiles ? (
					<button
						type="button"
						onClick={onManageProfiles}
						className={
							activeView === 'profiles'
								? activeButton
								: secondaryButton
						}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect
								x="2"
								y="2"
								width="20"
								height="8"
								rx="2"
								ry="2"
							/>
							<rect
								x="2"
								y="14"
								width="20"
								height="8"
								rx="2"
								ry="2"
							/>
							<line x1="6" y1="6" x2="6.01" y2="6" />
							<line x1="6" y1="18" x2="6.01" y2="18" />
						</svg>
						<span className="hidden sm:inline">Servers</span>
					</button>
				) : null}
				{onManageFriends ? (
					<button
						type="button"
						onClick={onManageFriends}
						className={
							activeView === 'friends'
								? activeButton
								: secondaryButton
						}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
						<span className="hidden sm:inline">Friends</span>
					</button>
				) : null}
				{onManageBlocklist ? (
					<button
						type="button"
						onClick={onManageBlocklist}
						className={
							activeView === 'blocklist'
								? activeButton
								: secondaryButton
						}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
						</svg>
						<span className="hidden sm:inline">Blocked</span>
					</button>
				) : null}
				{onManageSettings ? (
					<button
						type="button"
						onClick={onManageSettings}
						className={
							activeView === 'settings'
								? activeButton
								: secondaryButton
						}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
						</svg>
						<span className="hidden sm:inline">Settings</span>
					</button>
				) : null}
			</div>
		</header>
	);
};

export { HeaderBar };
