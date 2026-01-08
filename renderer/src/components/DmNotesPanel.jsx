import { useState } from 'react';
import { getNickColorClasses } from '../irc/formatting.js';
import { inputClass } from '../ui/classes.js';

const DmNotesPanel = ({
	nick,
	connectionLabel,
	isFriend,
	notes,
	onSaveNotes,
}) => {
	const normalizedNotes = notes || '';
	const [draft, setDraft] = useState(normalizedNotes);

	if (!nick) {
		return null;
	}

	const displayNick = nick;
	const nickColor = getNickColorClasses(displayNick);
	const avatarClass = nickColor ? nickColor.bg : 'bg-neutral-500';
	const nameClass = nickColor ? nickColor.text : 'text-neutral-900 dark:text-neutral-100';
	const isDirty = draft.trim() !== normalizedNotes.trim();

	const handleSave = () => {
		if (!onSaveNotes) {
			return;
		}
		onSaveNotes(draft);
	};

	return (
		<aside className="h-full w-56 flex-shrink-0 border-l border-neutral-200 bg-white flex flex-col dark:bg-neutral-900 dark:border-neutral-800">
			<div className="border-b border-neutral-200/50 px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/50 dark:border-neutral-800">
				<div className="flex items-center gap-3">
					<div
						className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white ${avatarClass}`}
					>
						{displayNick[0].toUpperCase()}
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className={`text-sm font-semibold truncate ${nameClass}`}>
								{displayNick}
							</span>
							{isFriend && (
								<span className="text-[10px] font-medium text-amber-500 bg-amber-100/70 rounded px-1.5 py-0.5 dark:bg-amber-900/30 dark:text-amber-300">
									Friend
								</span>
							)}
						</div>
						{connectionLabel && (
							<p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
								{connectionLabel}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4">
				<div className="flex items-center justify-between mb-2">
					<span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
						Notes
					</span>
				</div>
				<textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					placeholder="Add notes about this user"
					className={`${inputClass} resize-none min-h-[180px]`}
					rows={8}
				/>
				<button
					type="button"
					onClick={handleSave}
					disabled={!isDirty}
					className="mt-3 w-full px-3 py-2 text-sm font-semibold rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-600 dark:hover:bg-neutral-500 transition-colors"
				>
					Save notes
				</button>
			</div>
		</aside>
	);
};

export { DmNotesPanel };
