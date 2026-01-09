import {
	Ban,
	CheckCircle,
	Moon,
	RefreshCw,
	Server,
	Settings,
	Sun,
	Users,
} from 'lucide-react';

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
					<CheckCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />
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
							<RefreshCw className="w-3 h-3 opacity-60" />
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
							<Sun className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Light</span>
						</>
					) : (
						<>
							<Moon className="w-3.5 h-3.5" />
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
						<Server className="w-3.5 h-3.5" />
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
						<Users className="w-3.5 h-3.5" />
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
						<Ban className="w-3.5 h-3.5" />
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
						<Settings className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">Settings</span>
					</button>
				) : null}
			</div>
		</header>
	);
};

export { HeaderBar };
