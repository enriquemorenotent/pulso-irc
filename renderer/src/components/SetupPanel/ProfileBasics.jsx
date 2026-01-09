import { inputClass, labelClass } from '../../ui/classes.js';

const ProfileBasics = ({ activeDraft, onChangeName, onChangeSettings }) => (
	<div className="grid gap-4 sm:grid-cols-2">
		<label className="block">
			<span className={labelClass}>Profile Name</span>
			<input
				className={`${inputClass} mt-1.5`}
				value={activeDraft.name}
				onChange={(e) => onChangeName(e.target.value)}
				placeholder="e.g., Libera Chat"
			/>
		</label>
		<label className="block">
			<span className={labelClass}>
				Server Host <span className="text-rose-500">*</span>
			</span>
			<input
				className={`${inputClass} mt-1.5`}
				value={activeDraft.settings.host || ''}
				onChange={(e) =>
					onChangeSettings({
						host: e.target.value,
					})
				}
				placeholder="irc.libera.chat"
			/>
		</label>
	</div>
);

export { ProfileBasics };
