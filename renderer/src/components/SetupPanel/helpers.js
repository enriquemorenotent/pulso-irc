const createProfileDraft = (profile) => ({
	name: profile.name || '',
	settings: { ...(profile.settings || {}) },
});

const profileKeys = [
	'connId',
	'host',
	'port',
	'nick',
	'username',
	'realname',
	'saslPassword',
	'autoJoin',
	'receiveRaw',
];

const areProfilesEqual = (draft, saved) => {
	if (!draft || !saved) {
		return false;
	}

	if ((draft.name || '') !== (saved.name || '')) {
		return false;
	}

	const draftSettings = draft.settings || {};
	const savedSettings = saved.settings || {};

	return profileKeys.every((key) => {
		if (key === 'receiveRaw') {
			return (
				Boolean(draftSettings.receiveRaw) ===
				Boolean(savedSettings.receiveRaw)
			);
		}

		return (draftSettings[key] || '') === (savedSettings[key] || '');
	});
};

export { createProfileDraft, areProfilesEqual };
