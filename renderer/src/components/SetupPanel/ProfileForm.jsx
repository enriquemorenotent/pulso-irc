import { ProfileBasics } from './ProfileBasics.jsx';
import { ProfileAutoJoin } from './ProfileAutoJoin.jsx';
import { ProfileAuth } from './ProfileAuth.jsx';
import { ProfileAdvanced } from './ProfileAdvanced.jsx';
import { ProfileActions } from './ProfileActions.jsx';

const ProfileForm = ({
	defaults,
	activeProfile,
	activeDraft,
	profileDirty,
	showAdvanced,
	onToggleAdvanced,
	onChangeSettings,
	onChangeName,
	onSave,
	onReset,
	error,
}) => {
	if (!activeProfile) {
		return null;
	}

	const effectiveSaslMethod = activeDraft.settings.saslMethod || '';

	return (
		<div className="space-y-5">
			<ProfileBasics
				activeDraft={activeDraft}
				onChangeName={onChangeName}
				onChangeSettings={onChangeSettings}
			/>
			<ProfileAutoJoin
				activeDraft={activeDraft}
				onChangeSettings={onChangeSettings}
			/>
			<ProfileAuth
				effectiveSaslMethod={effectiveSaslMethod}
				activeDraft={activeDraft}
				onChangeSettings={onChangeSettings}
			/>

			<button
				type="button"
				onClick={onToggleAdvanced}
				className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 cursor-pointer"
			>
				{showAdvanced ? '− Hide' : '+ Show'} advanced options
			</button>

			{showAdvanced && (
				<ProfileAdvanced
					defaults={defaults}
					activeDraft={activeDraft}
					onChangeSettings={onChangeSettings}
				/>
			)}

			{profileDirty && (
				<ProfileActions onSave={onSave} onReset={onReset} />
			)}

			{error && (
				<p className="text-sm text-rose-600 dark:text-rose-400">
					{error}
				</p>
			)}
		</div>
	);
};

export { ProfileForm };
