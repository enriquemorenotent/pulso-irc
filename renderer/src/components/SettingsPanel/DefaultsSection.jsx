import { inputClass, labelClass } from '../../ui/classes.js';

const DefaultsSection = ({
	draftDefaults,
	defaultsDirty,
	updateDraftDefaults,
	onSaveDefaults,
	onResetDefaults,
}) => (
	<div>
		<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
			Global Defaults
		</h2>
		<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
			These values are used for all servers unless overridden per-profile.
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
					onClick={onSaveDefaults}
					className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
				>
					Save
				</button>
				<button
					type="button"
					onClick={onResetDefaults}
					className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-neutral-200"
				>
					Discard
				</button>
			</div>
		)}
	</div>
);

export { DefaultsSection };
