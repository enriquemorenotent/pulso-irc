import { Settings } from 'lucide-react';
import { inputClass, labelClass } from '../ui/classes.js';

const SetupDefaultsCard = ({
	draftDefaults,
	onChange,
	onSave,
	onReset,
	isDirty,
}) => (
	<div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
		<div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
			<div className="flex items-center gap-2">
				<Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
				<h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
					Global Defaults
				</h2>
			</div>
			{isDirty && (
				<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
					<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
					Unsaved
				</span>
			)}
		</div>
		<div className="p-5">
			<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
				These values apply to all profiles unless overridden.
			</p>
			<div className="space-y-4">
				<label className="block">
					<span className={labelClass}>
						Nick <span className="text-rose-500">*</span>
					</span>
					<input
						className={`${inputClass} mt-1.5`}
						value={draftDefaults.nick}
						onChange={(event) =>
							onChange({ nick: event.target.value })
						}
						placeholder="YourNickname"
					/>
				</label>

				<label className="block">
					<span className={labelClass}>
						Username <span className="text-rose-500">*</span>
					</span>
					<input
						className={`${inputClass} mt-1.5`}
						value={draftDefaults.username}
						onChange={(event) =>
							onChange({ username: event.target.value })
						}
						placeholder="username"
					/>
				</label>

				<label className="block">
					<span className={labelClass}>
						Realname <span className="text-rose-500">*</span>
					</span>
					<input
						className={`${inputClass} mt-1.5`}
						value={draftDefaults.realname}
						onChange={(event) =>
							onChange({ realname: event.target.value })
						}
						placeholder="Your Name"
					/>
				</label>

				<label className="block">
					<span className={labelClass}>Default IRC Port</span>
					<input
						className={`${inputClass} mt-1.5`}
						value={draftDefaults.port}
						onChange={(event) =>
							onChange({ port: event.target.value })
						}
						inputMode="numeric"
						placeholder="6697"
					/>
				</label>
			</div>

			<div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-700 flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={onSave}
					disabled={!isDirty}
					className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
				>
					Save
				</button>
				<button
					type="button"
					onClick={onReset}
					disabled={!isDirty}
					className="inline-flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-600"
				>
					Discard
				</button>
			</div>
		</div>
	</div>
);

export { SetupDefaultsCard };
