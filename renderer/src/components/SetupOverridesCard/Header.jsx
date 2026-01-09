import { Pencil } from 'lucide-react';

const Header = ({ isDirty, onReset, onSave }) => (
	<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
		<div className="flex items-center gap-3">
			<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40">
				<Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
			</div>
			<div>
				<h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
					Profile Settings
				</h2>
				<p className="text-xs text-neutral-500 dark:text-neutral-400">
					Configure this server profile
				</p>
			</div>
		</div>
		<div className="flex items-center gap-3">
			{isDirty && (
				<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
					<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
					Unsaved
				</span>
			)}
			<button
				type="button"
				onClick={onReset}
				disabled={!isDirty}
				className="inline-flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-600"
			>
				Discard
			</button>
			<button
				type="button"
				onClick={onSave}
				disabled={!isDirty}
				className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
			>
				Save Profile
			</button>
		</div>
	</div>
);

export { Header };
