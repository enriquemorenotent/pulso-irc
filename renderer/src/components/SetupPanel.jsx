import { useState } from 'react';
import { SearchableSelect } from './SearchableSelect.jsx';
import { inputClass, labelClass } from '../ui/classes.js';

const createProfileDraft = (profile) => ({
	name: profile.name || '',
	settings: { ...(profile.settings || {}) },
});

const profileKeys = [
	'connId',
	'host',
	'port',
	'nick',
	'username',
	'realname',
	'saslPassword',
	'autoJoin',
	'receiveRaw',
];

const areProfilesEqual = (draft, saved) => {
	if (!draft || !saved) {
		return false;
	}

	if ((draft.name || '') !== (saved.name || '')) {
		return false;
	}

	const draftSettings = draft.settings || {};
	const savedSettings = saved.settings || {};

	return profileKeys.every((key) => {
		if (key === 'receiveRaw') {
			return (
				Boolean(draftSettings.receiveRaw) ===
				Boolean(savedSettings.receiveRaw)
			);
		}

		return (draftSettings[key] || '') === (savedSettings[key] || '');
	});
};

/**
 * SetupPanel - Server profile management only.
 * Global defaults and backup/restore are in SettingsPanel.
 */
const SetupPanel = ({
	defaults,
	profiles,
	activeProfileId,
	onSwitchProfile,
	onAddProfile,
	activeProfile,
	updateProfile,
	updateProfileName,
	error,
}) => {
	const [draftProfiles, setDraftProfiles] = useState(() => {
		const next = {};
		profiles.forEach((profile) => {
			next[profile.id] = createProfileDraft(profile);
		});
		return next;
	});
	const [showAdvanced, setShowAdvanced] = useState(false);

	const activeDraft =
		draftProfiles[activeProfileId] || createProfileDraft(activeProfile);
	const profileDirty = !areProfilesEqual(activeDraft, activeProfile);

	const updateDraftProfile = (updates) => {
		setDraftProfiles((prev) => {
			const current =
				prev[activeProfileId] || createProfileDraft(activeProfile);
			return {
				...prev,
				[activeProfileId]: {
					...current,
					settings: { ...current.settings, ...updates },
				},
			};
		});
	};

	const updateDraftProfileName = (name) => {
		setDraftProfiles((prev) => {
			const current =
				prev[activeProfileId] || createProfileDraft(activeProfile);
			return {
				...prev,
				[activeProfileId]: {
					...current,
					name,
				},
			};
		});
	};

	const handleSaveProfile = () => {
		updateProfileName(activeDraft.name);
		updateProfile(activeDraft.settings);
		setDraftProfiles((prev) => ({
			...prev,
			[activeProfileId]: createProfileDraft(activeDraft),
		}));
	};

	const handleResetProfile = () => {
		setDraftProfiles((prev) => ({
			...prev,
			[activeProfileId]: createProfileDraft(activeProfile),
		}));
	};

	const handleAddProfile = () => {
		const nextProfile = onAddProfile();
		if (!nextProfile) {
			return;
		}
		setDraftProfiles((prev) => ({
			...prev,
			[nextProfile.id]: createProfileDraft(nextProfile),
		}));
	};

	const effectiveSaslMethod = activeDraft.settings.saslMethod || '';

	// Prepare options for searchable select
	const profileOptions = profiles.map((profile) => ({
		id: profile.id,
		name: profile.name,
		host: profile.settings?.host || '',
	}));

	return (
		<section className="min-h-0 overflow-y-auto">
			<div className="max-w-xl mx-auto p-6 lg:p-8">
				{/* Profile selector */}
				<div className="flex items-end gap-3 mb-6">
					<div className="flex-1">
						<label className={`${labelClass} block mb-2`}>
							Server Profile
						</label>
						<SearchableSelect
							options={profileOptions}
							value={activeProfileId || ''}
							onChange={onSwitchProfile}
							placeholder="Search servers..."
							getOptionValue={(opt) => opt.id}
							getOptionLabel={(opt) => opt.name}
							renderOption={(opt, isSelected) => (
								<div>
									<div
										className={`font-medium ${
											isSelected ? '' : ''
										}`}
									>
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
					</div>
					<button
						type="button"
						onClick={handleAddProfile}
						className="px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
					>
						+ New
					</button>
				</div>

				{/* Profile form */}
				{activeProfile && (
					<div className="space-y-5">
						{/* Profile name + Host */}
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className={labelClass}>Profile Name</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={activeDraft.name}
									onChange={(e) =>
										updateDraftProfileName(e.target.value)
									}
									placeholder="e.g., Libera Chat"
								/>
							</label>
							<label className="block">
								<span className={labelClass}>
									Server Host{' '}
									<span className="text-rose-500">*</span>
								</span>
								<input
									className={`${inputClass} mt-1.5`}
									value={activeDraft.settings.host || ''}
									onChange={(e) =>
										updateDraftProfile({
											host: e.target.value,
										})
									}
									placeholder="irc.libera.chat"
								/>
							</label>
						</div>

						{/* Auto-join */}
						<label className="block">
							<span className={labelClass}>
								Auto-join Channels
							</span>
							<input
								className={`${inputClass} mt-1.5`}
								value={activeDraft.settings.autoJoin || ''}
								onChange={(e) =>
									updateDraftProfile({
										autoJoin: e.target.value,
									})
								}
								placeholder="#channel1, #channel2"
							/>
							<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
								Comma or space separated
							</p>
						</label>

						{/* SASL */}
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className={labelClass}>
									Authentication
								</span>
								<select
									className={`${inputClass} mt-1.5 cursor-pointer`}
									value={effectiveSaslMethod}
									onChange={(e) =>
										updateDraftProfile({
											saslMethod: e.target.value,
										})
									}
								>
									<option value="">None</option>
									<option value="PLAIN">
										SASL PLAIN (password)
									</option>
									<option value="EXTERNAL">
										SASL EXTERNAL (certificate)
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
										value={
											activeDraft.settings.saslPassword ||
											''
										}
										onChange={(e) =>
											updateDraftProfile({
												saslPassword: e.target.value,
											})
										}
										placeholder="••••••••"
									/>
								</label>
							)}
						</div>

						{/* Advanced toggle */}
						<button
							type="button"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 cursor-pointer"
						>
							{showAdvanced ? '− Hide' : '+ Show'} advanced
							options
						</button>

						{showAdvanced && (
							<div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
								<p className="text-xs text-neutral-500 dark:text-neutral-400">
									Override global defaults for this server
									only:
								</p>
								<div className="grid gap-4 sm:grid-cols-2">
									<label className="block">
										<span className={labelClass}>Nick</span>
										<input
											className={`${inputClass} mt-1.5`}
											value={
												activeDraft.settings.nick || ''
											}
											onChange={(e) =>
												updateDraftProfile({
													nick: e.target.value,
												})
											}
											placeholder={
												defaults.nick || 'Use default'
											}
										/>
									</label>
									<label className="block">
										<span className={labelClass}>Port</span>
										<input
											className={`${inputClass} mt-1.5`}
											value={
												activeDraft.settings.port || ''
											}
											onChange={(e) =>
												updateDraftProfile({
													port: e.target.value,
												})
											}
											placeholder={
												defaults.port || '6697'
											}
											inputMode="numeric"
										/>
									</label>
									<label className="block">
										<span className={labelClass}>
											Username
										</span>
										<input
											className={`${inputClass} mt-1.5`}
											value={
												activeDraft.settings.username ||
												''
											}
											onChange={(e) =>
												updateDraftProfile({
													username: e.target.value,
												})
											}
											placeholder={
												defaults.username ||
												'Use default'
											}
										/>
									</label>
									<label className="block">
										<span className={labelClass}>
											Realname
										</span>
										<input
											className={`${inputClass} mt-1.5`}
											value={
												activeDraft.settings.realname ||
												''
											}
											onChange={(e) =>
												updateDraftProfile({
													realname: e.target.value,
												})
											}
											placeholder={
												defaults.realname ||
												'Use default'
											}
										/>
									</label>
								</div>
								<label className="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										className="w-4 h-4 rounded border-neutral-300 text-blue-600 cursor-pointer dark:border-neutral-600 dark:bg-neutral-700"
										checked={Boolean(
											activeDraft.settings.receiveRaw
										)}
										onChange={(e) =>
											updateDraftProfile({
												receiveRaw: e.target.checked,
											})
										}
									/>
									<span className="text-sm text-neutral-700 dark:text-neutral-300">
										Show raw IRC messages (debugging)
									</span>
								</label>
							</div>
						)}

						{/* Save/discard */}
						{profileDirty && (
							<div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
								<button
									type="button"
									onClick={handleSaveProfile}
									className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
								>
									Save Changes
								</button>
								<button
									type="button"
									onClick={handleResetProfile}
									className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200"
								>
									Discard
								</button>
							</div>
						)}

						{/* Error display */}
						{error && (
							<p className="text-sm text-rose-600 dark:text-rose-400">
								{error}
							</p>
						)}
					</div>
				)}
			</div>
		</section>
	);
};

export { SetupPanel };
