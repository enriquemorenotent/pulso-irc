import { inputClass, labelClass } from '../../ui/classes.js';
import { FormSection } from './FormSection.jsx';

const UserIdentitySection = ({ defaults, draftSettings, onChangeProfile }) => (
	<FormSection title="User Identity (Overrides)">
		<p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2 mb-4">
			Leave fields empty to use global defaults
		</p>
		<div className="grid gap-4 sm:grid-cols-3">
			<label className="block">
				<span className={labelClass}>Nick</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={draftSettings.nick}
					onChange={(event) =>
						onChangeProfile({
							nick: event.target.value,
						})
					}
					placeholder={defaults.nick || 'Global default'}
				/>
			</label>

			<label className="block">
				<span className={labelClass}>Username</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={draftSettings.username}
					onChange={(event) =>
						onChangeProfile({
							username: event.target.value,
						})
					}
					placeholder={defaults.username || 'Global default'}
				/>
			</label>

			<label className="block">
				<span className={labelClass}>Realname</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={draftSettings.realname}
					onChange={(event) =>
						onChangeProfile({
							realname: event.target.value,
						})
					}
					placeholder={defaults.realname || 'Global default'}
				/>
			</label>
		</div>
	</FormSection>
);

export { UserIdentitySection };
