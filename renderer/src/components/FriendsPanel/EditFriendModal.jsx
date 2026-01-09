import { useState } from 'react';
import { inputClass } from '../../ui/classes.js';

const EditFriendModal = ({ friend, onSave, onClose }) => {
	const [nick, setNick] = useState(friend.displayNick || friend.nick);
	const [alias, setAlias] = useState(friend.alias || '');
	const [notes, setNotes] = useState(friend.notes || '');

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!nick.trim()) return;
		onSave(friend.id, {
			nick: nick.trim(),
			displayNick: nick.trim(),
			alias: alias.trim(),
			notes: notes.trim(),
		});
		onClose();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
					<h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
						Edit Friend
					</h3>
				</div>
				<form onSubmit={handleSubmit} className="p-6">
					<div className="grid gap-4">
						<div>
							<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
								Nick
							</label>
							<input
								type="text"
								value={nick}
								onChange={(e) => setNick(e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
								Alias
							</label>
							<input
								type="text"
								value={alias}
								onChange={(e) => setAlias(e.target.value)}
								placeholder="Optional display name"
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
								Notes
							</label>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Add notes about this friend"
								className={`${inputClass} resize-none`}
								rows={3}
							/>
						</div>
					</div>
					<div className="flex gap-3 justify-end mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!nick.trim()}
							className="px-4 py-2 text-sm font-medium bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-600 dark:hover:bg-neutral-500 transition-colors"
						>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export { EditFriendModal };
