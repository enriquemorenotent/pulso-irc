import { SearchableSelect } from './SearchableSelect.jsx';
import { inputClass, labelClass } from '../ui/classes.js';

const ConnectView = ({
	profiles,
	activeProfileId,
	onSelectProfile,
	effectiveSettings,
	missingNonSecretFields,
	needsSecrets,
	clientCert,
	setClientCert,
	clientKey,
	setClientKey,
	showValidation,
	onConnect,
	error,
}) => {
	const selectedProfile = profiles.find((p) => p.id === activeProfileId);
	const isConfigured = Boolean(effectiveSettings.host);
	const hasValidationErrors =
		showValidation && missingNonSecretFields.length > 0;
	const needsExternalCerts = effectiveSettings.saslMethod === 'EXTERNAL';

	// If only one profile, auto-select it
	if (profiles.length === 1 && !activeProfileId) {
		onSelectProfile(profiles[0].id);
	}

	// Prepare options for searchable select
	const profileOptions = profiles.map((profile) => ({
		id: profile.id,
		name: profile.name,
		host: profile.settings?.host || '',
	}));

	// Build connection label
	const connectionLabel = isConfigured
		? `${effectiveSettings.host}${
				effectiveSettings.port ? `:${effectiveSettings.port}` : ''
		  }`
		: '';

	return (
		<section className="min-h-0 overflow-y-auto">
			<div className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
				<header className="mb-8">
					<p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
						Connect
					</p>
					<h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
						Start a new connection
					</h2>
					<p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
						Search for a server profile and connect using your saved
						settings.
					</p>
				</header>

				{profiles.length > 0 ? (
					<div className="space-y-6">
						<div className="space-y-2">
							<label className={labelClass}>
								Server profile
							</label>
							{profiles.length > 1 ? (
								<SearchableSelect
									options={profileOptions}
									value={activeProfileId || ''}
									onChange={onSelectProfile}
									placeholder="Search servers..."
									getOptionValue={(opt) => opt.id}
									getOptionLabel={(opt) => opt.name}
									renderOption={(opt) => (
										<div>
											<div className="font-medium">
												{opt.name}
											</div>
											{opt.host && (
												<div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
													{opt.host}
												</div>
											)}
										</div>
									)}
								/>
							) : selectedProfile ? (
								<p className="text-sm text-neutral-500 dark:text-neutral-400">
									{selectedProfile.name}
								</p>
							) : null}
						</div>

						{selectedProfile ? (
							<div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
								<div>
									<p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
										Selected server
									</p>
									<div className="mt-2">
										<p className="text-lg font-semibold text-neutral-900 dark:text-white">
											{selectedProfile.name}
										</p>
										{connectionLabel ? (
											<p className="mt-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
												{connectionLabel}
											</p>
										) : null}
									</div>
								</div>

								{!isConfigured && (
									<p className="text-sm text-amber-600 dark:text-amber-400">
										Server not configured yet
									</p>
								)}

								{hasValidationErrors && (
									<p className="text-sm text-amber-600 dark:text-amber-400">
										Missing:{' '}
										{missingNonSecretFields.join(', ')}
									</p>
								)}

								{needsExternalCerts && (
									<div className="space-y-3">
										<label className="block">
											<span
												className={`${labelClass} text-xs`}
											>
												Client Certificate
											</span>
											<textarea
												className={`${inputClass} font-mono text-xs min-h-20 mt-1`}
												value={clientCert}
												onChange={(e) =>
													setClientCert(
														e.target.value
													)
												}
												placeholder="-----BEGIN CERTIFICATE-----"
											/>
										</label>
										<label className="block">
											<span
												className={`${labelClass} text-xs`}
											>
												Client Key
											</span>
											<textarea
												className={`${inputClass} font-mono text-xs min-h-20 mt-1`}
												value={clientKey}
												onChange={(e) =>
													setClientKey(e.target.value)
												}
												placeholder="-----BEGIN PRIVATE KEY-----"
											/>
										</label>
									</div>
								)}

								{showValidation &&
									needsSecrets &&
									!needsExternalCerts && (
										<p className="text-sm text-amber-600 dark:text-amber-400">
											{effectiveSettings.saslMethod}{' '}
											credentials required
										</p>
									)}

								{error && (
									<p className="text-sm text-rose-600 dark:text-rose-400">
										{error}
									</p>
								)}

								<button
									type="button"
									onClick={onConnect}
									disabled={
										hasValidationErrors || !isConfigured
									}
									className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
								>
									{isConfigured ? (
										<>
											Connect to{' '}
											<span className="font-mono">
												{connectionLabel}
											</span>
										</>
									) : (
										'Connect'
									)}
								</button>

								{isConfigured && effectiveSettings.nick && (
									<p className="text-xs text-neutral-500 dark:text-neutral-400">
										Connecting as {effectiveSettings.nick}
									</p>
								)}
							</div>
						) : (
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								Select a server to continue.
							</p>
						)}
					</div>
				) : (
					<div className="text-sm text-neutral-500 dark:text-neutral-400">
						No servers configured.
					</div>
				)}
			</div>
		</section>
	);
};

export { ConnectView };
