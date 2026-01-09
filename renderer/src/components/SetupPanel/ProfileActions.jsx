const ProfileActions = ({ onSave, onReset }) => (
	<div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
		<button
			type="button"
			onClick={onSave}
			className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
		>
			Save Changes
		</button>
		<button
			type="button"
			onClick={onReset}
			className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200"
		>
			Discard
		</button>
	</div>
);

export { ProfileActions };
