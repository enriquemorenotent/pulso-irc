import { useState } from 'react';
import { createProfileDraft, areProfilesEqual } from './SetupPanel/helpers.js';
import { ProfileSelector } from './SetupPanel/ProfileSelector.jsx';
import { ProfileForm } from './SetupPanel/ProfileForm.jsx';

const SetupPanel = ({
	defaults,
	profiles,
	activeProfileId,
	onSwitchProfile,
	onAddProfile,
	activeProfile,
	updateProfile,
	updateProfileName,
	error,
}) => {
	const [draftProfiles, setDraftProfiles] = useState(() => {
		const next = {};
		profiles.forEach((profile) => {
			next[profile.id] = createProfileDraft(profile);
		});
		return next;
	});
	const [showAdvanced, setShowAdvanced] = useState(false);

	const activeDraft =
		draftProfiles[activeProfileId] || createProfileDraft(activeProfile);
	const profileDirty = !areProfilesEqual(activeDraft, activeProfile);

	const updateDraftProfile = (updates) => {
		setDraftProfiles((prev) => {
			const current =
				prev[activeProfileId] || createProfileDraft(activeProfile);
			return {
				...prev,
				[activeProfileId]: {
					...current,
					settings: { ...current.settings, ...updates },
				},
			};
		});
	};

	const updateDraftProfileName = (name) => {
		setDraftProfiles((prev) => {
			const current =
				prev[activeProfileId] || createProfileDraft(activeProfile);
			return {
				...prev,
				[activeProfileId]: {
					...current,
					name,
				},
			};
		});
	};

	const handleSaveProfile = () => {
		updateProfileName(activeDraft.name);
		updateProfile(activeDraft.settings);
		setDraftProfiles((prev) => ({
			...prev,
			[activeProfileId]: createProfileDraft(activeDraft),
		}));
	};

	const handleResetProfile = () => {
		setDraftProfiles((prev) => ({
			...prev,
			[activeProfileId]: createProfileDraft(activeProfile),
		}));
	};

	const handleAddProfile = () => {
		const nextProfile = onAddProfile();
		if (!nextProfile) {
			return;
		}
		setDraftProfiles((prev) => ({
			...prev,
			[nextProfile.id]: createProfileDraft(nextProfile),
		}));
	};

	return (
		<section className="min-h-0 overflow-y-auto">
			<div className="max-w-xl mx-auto p-6 lg:p-8">
				<ProfileSelector
					profiles={profiles}
					activeProfileId={activeProfileId}
					onSwitchProfile={onSwitchProfile}
					onAddProfile={handleAddProfile}
				/>

				<ProfileForm
					defaults={defaults}
					activeProfile={activeProfile}
					activeDraft={activeDraft}
					profileDirty={profileDirty}
					showAdvanced={showAdvanced}
					onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
					onChangeSettings={updateDraftProfile}
					onChangeName={updateDraftProfileName}
					onSave={handleSaveProfile}
					onReset={handleResetProfile}
					error={error}
				/>
			</div>
		</section>
	);
};

export { SetupPanel };
