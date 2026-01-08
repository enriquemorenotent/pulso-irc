import { inputClass, labelClass } from '../ui/classes.js';

const EditIcon = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
		<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
	</svg>
);

const FormSection = ({ title, children }) => (
	<div className="space-y-4">
		<h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-100 dark:border-neutral-700">
			{title}
		</h3>
		{children}
	</div>
);

const SetupOverridesCard = ({
	defaults,
	activeProfileName,
	draftSettings,
	onChangeProfile,
	onChangeProfileName,
	onSave,
	onReset,
	isDirty,
}) => {
	const effectiveSaslMethod = draftSettings.saslMethod || '';

	return (
		<div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden h-full flex flex-col">
			{/* Header with save actions */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40">
						<EditIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
							Profile Settings
						</h2>
						<p className="text-xs text-neutral-500 dark:text-neutral-400">
							Configure this server profile
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					{isDirty && (
						<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
							<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
							Unsaved
						</span>
					)}
					<button
						type="button"
						onClick={onReset}
						disabled={!isDirty}
						className="inline-flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-600"
					>
						Discard
					</button>
					<button
						type="button"
						onClick={onSave}
						disabled={!isDirty}
						className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
					>
						Save Profile
					</button>
				</div>
			</div>

			{/* Form content */}
			<div className="p-6 flex-1 overflow-y-auto">
				<div className="max-w-3xl space-y-8">
					{/* Profile Identity */}
					<FormSection title="Profile Identity">
						<label className="block">
							<span className={labelClass}>Profile Name</span>
							<input
								className={`${inputClass} mt-1.5`}
								value={activeProfileName}
								onChange={(event) =>
									onChangeProfileName(event.target.value)
								}
								placeholder="My IRC Server"
							/>
							<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
								A friendly name to identify this server
							</p>
						</label>
					</FormSection>

					{/* Server Connection */}
					<FormSection title="Server Connection">
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block sm:col-span-2">
								<span className={labelClass}>
									IRC Host{' '}
									<span className="text-rose-500">*</span>
								</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={draftSettings.host}
									onChange={(event) =>
										onChangeProfile({
											host: event.target.value,
										})
									}
									placeholder="irc.libera.chat"
								/>
							</label>

							<label className="block">
								<span className={labelClass}>
									Port Override
								</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={draftSettings.port || ''}
									onChange={(event) =>
										onChangeProfile({
											port: event.target.value,
										})
									}
									placeholder={defaults.port || '6697'}
									inputMode="numeric"
								/>
								<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
									Leave empty to use global default
								</p>
							</label>

							<label className="block">
								<span className={labelClass}>
									Auto-join Channels
								</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={draftSettings.autoJoin}
									onChange={(event) =>
										onChangeProfile({
											autoJoin: event.target.value,
										})
									}
									placeholder="#channel1, #channel2"
								/>
								<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
									Comma or space separated
								</p>
							</label>
						</div>
					</FormSection>

					{/* User Identity */}
					<FormSection title="User Identity (Overrides)">
						<p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2 mb-4">
							Leave fields empty to use global defaults
						</p>
						<div className="grid gap-4 sm:grid-cols-3">
							<label className="block">
								<span className={labelClass}>Nick</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={draftSettings.nick}
									onChange={(event) =>
										onChangeProfile({
											nick: event.target.value,
										})
									}
									placeholder={
										defaults.nick || 'Global default'
									}
								/>
							</label>

							<label className="block">
								<span className={labelClass}>Username</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={draftSettings.username}
									onChange={(event) =>
										onChangeProfile({
											username: event.target.value,
										})
									}
									placeholder={
										defaults.username || 'Global default'
									}
								/>
							</label>

							<label className="block">
								<span className={labelClass}>Realname</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={draftSettings.realname}
									onChange={(event) =>
										onChangeProfile({
											realname: event.target.value,
										})
									}
									placeholder={
										defaults.realname || 'Global default'
									}
								/>
							</label>
						</div>
					</FormSection>

					{/* Authentication */}
					<FormSection title="Authentication">
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className={labelClass}>SASL Method</span>
								<select
									className={`${inputClass} mt-1.5 cursor-pointer`}
									value={draftSettings.saslMethod || ''}
									onChange={(event) =>
										onChangeProfile({
											saslMethod: event.target.value,
										})
									}
								>
									<option value="">None</option>
									<option value="PLAIN">
										PLAIN (password)
									</option>
									<option value="EXTERNAL">
										EXTERNAL (certificate)
									</option>
								</select>
							</label>

							{effectiveSaslMethod === 'PLAIN' && (
								<label className="block">
									<span className={labelClass}>
										SASL Password
									</span>
									<input
										className={`${inputClass} mt-1.5`}
										type="password"
										value={draftSettings.saslPassword}
										onChange={(event) =>
											onChangeProfile({
												saslPassword:
													event.target.value,
											})
										}
										placeholder="••••••••"
									/>
									<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
										Stored locally
									</p>
								</label>
							)}
						</div>

						{effectiveSaslMethod === 'EXTERNAL' && (
							<div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/50 dark:bg-blue-900/20">
								<p className="text-sm text-blue-800 dark:text-blue-200">
									Client certificates for EXTERNAL auth will
									be requested when connecting.
								</p>
							</div>
						)}
					</FormSection>

					{/* Advanced Options */}
					<FormSection title="Advanced">
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:border-neutral-600 dark:bg-neutral-700"
								checked={Boolean(draftSettings.receiveRaw)}
								onChange={(event) =>
									onChangeProfile({
										receiveRaw: event.target.checked,
									})
								}
							/>
							<div>
								<span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
									Receive raw IRC messages
								</span>
								<p className="text-xs text-neutral-500 dark:text-neutral-400">
									Show raw protocol messages in a status
									window (for debugging)
								</p>
							</div>
						</label>
					</FormSection>
				</div>
			</div>
		</div>
	);
};

export { SetupOverridesCard };
