import { useRef, useState } from 'react';
import { applyBackup, exportBackup, parseBackup } from '../irc/backup.js';
import { DefaultsSection } from './SettingsPanel/DefaultsSection.jsx';
import { PrivacySection } from './SettingsPanel/PrivacySection.jsx';
import { BackupSection } from './SettingsPanel/BackupSection.jsx';

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
				<DefaultsSection
					draftDefaults={draftDefaults}
					defaults={defaults}
					defaultsDirty={defaultsDirty}
					updateDraftDefaults={updateDraftDefaults}
					onSaveDefaults={handleSaveDefaults}
					onResetDefaults={handleResetDefaults}
				/>

				<hr className="border-neutral-200 dark:border-neutral-700" />

				<PrivacySection
					draftDefaults={draftDefaults}
					updateDraftDefaults={updateDraftDefaults}
				/>

				<hr className="border-neutral-200 dark:border-neutral-700" />

				<BackupSection
					dataStatus={dataStatus}
					dataError={dataError}
					onExportData={handleExportData}
					onImportClick={handleImportClick}
					onImportFile={handleImportFile}
					fileInputRef={fileInputRef}
				/>
			</div>
		</section>
	);
};

export { SettingsPanel };
