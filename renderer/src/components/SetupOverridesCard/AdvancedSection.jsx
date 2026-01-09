import { FormSection } from './FormSection.jsx';

const AdvancedSection = ({ draftSettings, onChangeProfile }) => (
	<FormSection title="Advanced">
		<label className="flex items-center gap-3 cursor-pointer">
			<input
				type="checkbox"
				className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:border-neutral-600 dark:bg-neutral-700"
				checked={Boolean(draftSettings.receiveRaw)}
				onChange={(event) =>
					onChangeProfile({
						receiveRaw: event.target.checked,
					})
				}
			/>
			<div>
				<span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
					Receive raw IRC messages
				</span>
				<p className="text-xs text-neutral-500 dark:text-neutral-400">
					Show raw protocol messages in a status window (for debugging)
				</p>
			</div>
		</label>
	</FormSection>
);

export { AdvancedSection };
