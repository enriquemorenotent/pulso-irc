const BackupSection = ({
	dataStatus,
	dataError,
	onExportData,
	onImportClick,
	onImportFile,
	fileInputRef,
}) => (
	<div>
		<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
			Backup & Restore
		</h2>
		<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
			Export or import all local data including profiles, friends, logs,
			and settings.
		</p>
		<div className="flex gap-3">
			<button
				type="button"
				onClick={onExportData}
				className="px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-700"
			>
				Export Data
			</button>
			<button
				type="button"
				onClick={onImportClick}
				className="px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-700"
			>
				Import Data
			</button>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/json"
				onChange={onImportFile}
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
);

export { BackupSection };
