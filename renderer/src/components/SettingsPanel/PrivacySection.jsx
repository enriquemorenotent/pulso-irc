const PrivacySection = ({ draftDefaults, updateDraftDefaults }) => (
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
			When enabled, image/video links are loaded directly from their URLs.
		</p>
	</div>
);

export { PrivacySection };
