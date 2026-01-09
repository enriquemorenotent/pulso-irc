import { inputClass, labelClass } from '../../ui/classes.js';

const ProfileAuth = ({ effectiveSaslMethod, activeDraft, onChangeSettings }) => (
	<div className="grid gap-4 sm:grid-cols-2">
		<label className="block">
			<span className={labelClass}>Authentication</span>
			<select
				className={`${inputClass} mt-1.5 cursor-pointer`}
				value={effectiveSaslMethod}
				onChange={(e) =>
					onChangeSettings({
						saslMethod: e.target.value,
					})
				}
			>
				<option value="">None</option>
				<option value="PLAIN">SASL PLAIN (password)</option>
				<option value="EXTERNAL">SASL EXTERNAL (certificate)</option>
			</select>
		</label>
		{effectiveSaslMethod === 'PLAIN' && (
			<label className="block">
				<span className={labelClass}>SASL Password</span>
				<input
					className={`${inputClass} mt-1.5`}
					type="password"
					value={activeDraft.settings.saslPassword || ''}
					onChange={(e) =>
						onChangeSettings({
							saslPassword: e.target.value,
						})
					}
					placeholder="••••••••"
				/>
			</label>
		)}
	</div>
);

export { ProfileAuth };
