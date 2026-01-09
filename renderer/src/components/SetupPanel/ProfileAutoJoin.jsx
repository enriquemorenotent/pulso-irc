import { inputClass, labelClass } from '../../ui/classes.js';

const ProfileAutoJoin = ({ activeDraft, onChangeSettings }) => (
	<label className="block">
		<span className={labelClass}>Auto-join Channels</span>
		<input
			className={`${inputClass} mt-1.5`}
			value={activeDraft.settings.autoJoin || ''}
			onChange={(e) =>
				onChangeSettings({
					autoJoin: e.target.value,
				})
			}
			placeholder="#channel1, #channel2"
		/>
		<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
			Comma or space separated
		</p>
	</label>
);

export { ProfileAutoJoin };
