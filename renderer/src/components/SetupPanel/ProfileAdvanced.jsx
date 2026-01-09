import { inputClass, labelClass } from '../../ui/classes.js';

const ProfileAdvanced = ({ defaults, activeDraft, onChangeSettings }) => (
	<div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
		<p className="text-xs text-neutral-500 dark:text-neutral-400">
			Override global defaults for this server only:
		</p>
		<div className="grid gap-4 sm:grid-cols-2">
			<label className="block">
				<span className={labelClass}>Nick</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={activeDraft.settings.nick || ''}
					onChange={(e) =>
						onChangeSettings({
							nick: e.target.value,
						})
					}
					placeholder={defaults.nick || 'Use default'}
				/>
			</label>
			<label className="block">
				<span className={labelClass}>Port</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={activeDraft.settings.port || ''}
					onChange={(e) =>
						onChangeSettings({
							port: e.target.value,
						})
					}
					placeholder={defaults.port || '6697'}
					inputMode="numeric"
				/>
			</label>
			<label className="block">
				<span className={labelClass}>Username</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={activeDraft.settings.username || ''}
					onChange={(e) =>
						onChangeSettings({
							username: e.target.value,
						})
					}
					placeholder={defaults.username || 'Use default'}
				/>
			</label>
			<label className="block">
				<span className={labelClass}>Realname</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={activeDraft.settings.realname || ''}
					onChange={(e) =>
						onChangeSettings({
							realname: e.target.value,
						})
					}
					placeholder={defaults.realname || 'Use default'}
				/>
			</label>
		</div>
		<label className="flex items-center gap-3 cursor-pointer">
			<input
				type="checkbox"
				className="w-4 h-4 rounded border-neutral-300 text-blue-600 cursor-pointer dark:border-neutral-600 dark:bg-neutral-700"
				checked={Boolean(activeDraft.settings.receiveRaw)}
				onChange={(e) =>
					onChangeSettings({
						receiveRaw: e.target.checked,
					})
				}
			/>
			<span className="text-sm text-neutral-700 dark:text-neutral-300">
				Show raw IRC messages (debugging)
			</span>
		</label>
	</div>
);

export { ProfileAdvanced };
