import { useRef, useState } from 'react';
import { applyBackup, exportBackup, parseBackup } from '../irc/backup.js';
import { inputClass, labelClass } from '../ui/classes.js';

/**
 * SettingsPanel - App-wide settings that are not specific to server profiles.
 * - Global defaults (nick, username, realname, port)
 * - Backup & Restore (import/export all data)
 * - Theme toggle is in HeaderBar, not here
 */
const SettingsPanel = ({ defaults, updateDefaults }) => {
	const [draftDefaults, setDraftDefaults] = useState(() => ({ ...defaults }));
	const [dataStatus, setDataStatus] = useState('');
	const [dataError, setDataError] = useState('');
	const fileInputRef = useRef(null);

	const defaultsKeys = [
		'nick',
		'username',
		'realname',
		'port',
		'showMediaPreviews',
	];
	const defaultsDirty = !defaultsKeys.every(
		(key) => (draftDefaults?.[key] || '') === (defaults?.[key] || '')
	);

	const updateDraftDefaults = (updates) => {
		setDraftDefaults((prev) => ({ ...prev, ...updates }));
	};

	const handleSaveDefaults = () => {
		const nextDefaults = updateDefaults(draftDefaults);
		setDraftDefaults({ ...nextDefaults });
	};

	const handleResetDefaults = () => {
		setDraftDefaults({ ...defaults });
	};

	const handleExportData = () => {
		setDataError('');
		const result = exportBackup();
		if (!result.ok) {
			setDataStatus('');
			setDataError(result.error || 'Export failed.');
			return;
		}
		setDataStatus(`Exported: ${result.fileName}`);
	};

	const handleImportClick = () => {
		setDataError('');
		setDataStatus('');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
			fileInputRef.current.click();
		}
	};

	const handleImportFile = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) {
			return;
		}

		setDataError('');
		setDataStatus('');

		let raw = '';

		try {
			raw = await file.text();
		} catch {
			setDataError('Failed to read the file.');
			return;
		}

		const parsed = parseBackup(raw);
		if (!parsed.ok) {
			setDataError(parsed.error || 'Import failed.');
			return;
		}

		const confirmed = window.confirm(
			'Import will overwrite all local data (profiles, friends, logs, settings). Continue?'
		);

		if (!confirmed) {
			return;
		}

		const applied = applyBackup(parsed.backup);
		if (!applied.ok) {
			setDataError(applied.error || 'Import failed.');
			return;
		}

		setDataStatus('Import complete. Reloading...');
		setTimeout(() => {
			window.location.reload();
		}, 400);
	};

	return (
		<section className="min-h-0 overflow-y-auto">
			<div className="max-w-xl mx-auto p-6 lg:p-8 space-y-8">
				{/* Global Defaults */}
				<div>
					<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
						Global Defaults
					</h2>
					<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
						These values are used for all servers unless overridden
						per-profile.
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="block">
							<span className={labelClass}>Nick</span>
							<input
								className={`${inputClass} mt-1.5`}
								value={draftDefaults.nick || ''}
								onChange={(e) =>
									updateDraftDefaults({
										nick: e.target.value,
									})
								}
								placeholder="YourNick"
							/>
						</label>
						<label className="block">
							<span className={labelClass}>Username</span>
							<input
								className={`${inputClass} mt-1.5`}
								value={draftDefaults.username || ''}
								onChange={(e) =>
									updateDraftDefaults({
										username: e.target.value,
									})
								}
								placeholder="username"
							/>
						</label>
						<label className="block">
							<span className={labelClass}>Realname</span>
							<input
								className={`${inputClass} mt-1.5`}
								value={draftDefaults.realname || ''}
								onChange={(e) =>
									updateDraftDefaults({
										realname: e.target.value,
									})
								}
								placeholder="Your Name"
							/>
						</label>
						<label className="block">
							<span className={labelClass}>Port</span>
							<input
								className={`${inputClass} mt-1.5`}
								value={draftDefaults.port || ''}
								onChange={(e) =>
									updateDraftDefaults({
										port: e.target.value,
									})
								}
								placeholder="6697"
								inputMode="numeric"
							/>
						</label>
					</div>
					{defaultsDirty && (
						<div className="flex items-center gap-3 mt-4">
							<button
								type="button"
								onClick={handleSaveDefaults}
								className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
							>
								Save
							</button>
							<button
								type="button"
								onClick={handleResetDefaults}
								className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200"
							>
								Discard
							</button>
						</div>
					)}
				</div>

				<hr className="border-neutral-200 dark:border-neutral-700" />

				{/* Privacy */}
				<div>
					<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
						Privacy
					</h2>
					<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
						Control features that load external content.
					</p>
					<label className="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							className="w-4 h-4 rounded border-neutral-300 text-blue-600 cursor-pointer dark:border-neutral-600 dark:bg-neutral-700"
							checked={Boolean(draftDefaults.showMediaPreviews)}
							onChange={(e) =>
								updateDraftDefaults({
									showMediaPreviews: e.target.checked,
								})
							}
						/>
						<span className="text-sm text-neutral-700 dark:text-neutral-300">
							Show inline media previews
						</span>
					</label>
					<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
						When enabled, image/video links are loaded directly from
						their URLs.
					</p>
				</div>

				<hr className="border-neutral-200 dark:border-neutral-700" />

				{/* Backup & Restore */}
				<div>
					<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
						Backup & Restore
					</h2>
					<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
						Export or import all local data including profiles,
						friends, logs, and settings.
					</p>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleExportData}
							className="px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-700"
						>
							Export Data
						</button>
						<button
							type="button"
							onClick={handleImportClick}
							className="px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-700"
						>
							Import Data
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="application/json"
							onChange={handleImportFile}
							className="hidden"
						/>
					</div>
					{dataStatus && (
						<p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
							{dataStatus}
						</p>
					)}
					{dataError && (
						<p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
							{dataError}
						</p>
					)}
				</div>
			</div>
		</section>
	);
};

export { SettingsPanel };
