import { inputClass, labelClass } from '../../ui/classes.js';
import { FormSection } from './FormSection.jsx';

const ServerConnectionSection = ({ defaults, draftSettings, onChangeProfile }) => (
	<FormSection title="Server Connection">
		<div className="grid gap-4 sm:grid-cols-2">
			<label className="block sm:col-span-2">
				<span className={labelClass}>
					IRC Host <span className="text-rose-500">*</span>
				</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={draftSettings.host}
					onChange={(event) =>
						onChangeProfile({
							host: event.target.value,
						})
					}
					placeholder="irc.libera.chat"
				/>
			</label>

			<label className="block">
				<span className={labelClass}>Port Override</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={draftSettings.port || ''}
					onChange={(event) =>
						onChangeProfile({
							port: event.target.value,
						})
					}
					placeholder={defaults.port || '6697'}
					inputMode="numeric"
				/>
				<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
					Leave empty to use global default
				</p>
			</label>

			<label className="block">
				<span className={labelClass}>Auto-join Channels</span>
				<input
					className={`${inputClass} mt-1.5`}
					value={draftSettings.autoJoin}
					onChange={(event) =>
						onChangeProfile({
							autoJoin: event.target.value,
						})
					}
					placeholder="#channel1, #channel2"
				/>
				<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
					Comma or space separated
				</p>
			</label>
		</div>
	</FormSection>
);

export { ServerConnectionSection };
