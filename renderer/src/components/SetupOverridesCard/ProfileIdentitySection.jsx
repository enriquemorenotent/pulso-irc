import { inputClass, labelClass } from '../../ui/classes.js';
import { FormSection } from './FormSection.jsx';

const ProfileIdentitySection = ({ activeProfileName, onChangeProfileName }) => (
	<FormSection title="Profile Identity">
		<label className="block">
			<span className={labelClass}>Profile Name</span>
			<input
				className={`${inputClass} mt-1.5`}
				value={activeProfileName}
				onChange={(event) => onChangeProfileName(event.target.value)}
				placeholder="My IRC Server"
			/>
			<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
				A friendly name to identify this server
			</p>
		</label>
	</FormSection>
);

export { ProfileIdentitySection };
