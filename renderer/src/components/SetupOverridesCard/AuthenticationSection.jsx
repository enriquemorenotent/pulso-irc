import { inputClass, labelClass } from '../../ui/classes.js';
import { FormSection } from './FormSection.jsx';

const AuthenticationSection = ({ draftSettings, onChangeProfile }) => {
	const effectiveSaslMethod = draftSettings.saslMethod || '';

	return (
		<FormSection title="Authentication">
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="block">
					<span className={labelClass}>SASL Method</span>
					<select
						className={`${inputClass} mt-1.5 cursor-pointer`}
						value={effectiveSaslMethod}
						onChange={(event) =>
							onChangeProfile({
								saslMethod: event.target.value,
							})
						}
					>
						<option value="">None</option>
						<option value="PLAIN">PLAIN (password)</option>
						<option value="EXTERNAL">EXTERNAL (certificate)</option>
					</select>
				</label>

				{effectiveSaslMethod === 'PLAIN' && (
					<label className="block">
						<span className={labelClass}>SASL Password</span>
						<input
							className={`${inputClass} mt-1.5`}
							type="password"
							value={draftSettings.saslPassword}
							onChange={(event) =>
								onChangeProfile({
									saslPassword: event.target.value,
								})
							}
							placeholder="••••••••"
						/>
						<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
							Stored locally
						</p>
					</label>
				)}
			</div>

			{effectiveSaslMethod === 'EXTERNAL' && (
				<div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/50 dark:bg-blue-900/20">
					<p className="text-sm text-blue-800 dark:text-blue-200">
						Client certificates for EXTERNAL auth will be requested when
						connecting.
					</p>
				</div>
			)}
		</FormSection>
	);
};

export { AuthenticationSection };
