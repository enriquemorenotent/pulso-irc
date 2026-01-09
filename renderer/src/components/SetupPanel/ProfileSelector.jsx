import { SearchableSelect } from '../SearchableSelect.jsx';
import { labelClass } from '../../ui/classes.js';

const ProfileSelector = ({ profiles, activeProfileId, onSwitchProfile, onAddProfile }) => {
	const profileOptions = profiles.map((profile) => ({
		id: profile.id,
		name: profile.name,
		host: profile.settings?.host || '',
	}));

	return (
		<div className="flex items-end gap-3 mb-6">
			<div className="flex-1">
				<label className={`${labelClass} block mb-2`}>Server Profile</label>
				<SearchableSelect
					options={profileOptions}
					value={activeProfileId || ''}
					onChange={onSwitchProfile}
					placeholder="Search servers..."
					getOptionValue={(opt) => opt.id}
					getOptionLabel={(opt) => opt.name}
					renderOption={(opt, isSelected) => (
						<div>
							<div className={`font-medium ${isSelected ? '' : ''}`}>{opt.name}</div>
							{opt.host && (
								<div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
									{opt.host}
								</div>
							)}
						</div>
					)}
				/>
			</div>
			<button
				type="button"
				onClick={onAddProfile}
				className="px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
			>
				+ New
			</button>
		</div>
	);
};

export { ProfileSelector };
