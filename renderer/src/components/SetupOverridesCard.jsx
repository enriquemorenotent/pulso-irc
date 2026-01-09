import { Header } from './SetupOverridesCard/Header.jsx';
import { ProfileIdentitySection } from './SetupOverridesCard/ProfileIdentitySection.jsx';
import { ServerConnectionSection } from './SetupOverridesCard/ServerConnectionSection.jsx';
import { UserIdentitySection } from './SetupOverridesCard/UserIdentitySection.jsx';
import { AuthenticationSection } from './SetupOverridesCard/AuthenticationSection.jsx';
import { AdvancedSection } from './SetupOverridesCard/AdvancedSection.jsx';

const SetupOverridesCard = ({
	defaults,
	activeProfileName,
	draftSettings,
	onChangeProfile,
	onChangeProfileName,
	onSave,
	onReset,
	isDirty,
}) => (
	<div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden h-full flex flex-col">
		<Header isDirty={isDirty} onReset={onReset} onSave={onSave} />
		<div className="p-6 flex-1 overflow-y-auto">
			<div className="max-w-3xl space-y-8">
				<ProfileIdentitySection
					activeProfileName={activeProfileName}
					onChangeProfileName={onChangeProfileName}
				/>
				<ServerConnectionSection
					defaults={defaults}
					draftSettings={draftSettings}
					onChangeProfile={onChangeProfile}
				/>
				<UserIdentitySection
					defaults={defaults}
					draftSettings={draftSettings}
					onChangeProfile={onChangeProfile}
				/>
				<AuthenticationSection
					draftSettings={draftSettings}
					onChangeProfile={onChangeProfile}
				/>
				<AdvancedSection
					draftSettings={draftSettings}
					onChangeProfile={onChangeProfile}
				/>
			</div>
		</div>
	</div>
);

export { SetupOverridesCard };
