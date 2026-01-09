import { Ban, Plus, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { inputClass } from '../ui/classes.js';

const AddBlockForm = ({ onAdd, onCancel }) => {
	const [nick, setNick] = useState('');
	const [reason, setReason] = useState('');

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!nick.trim()) return;
		onAdd(nick.trim(), reason.trim());
		setNick('');
		setReason('');
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
		>
			<div className="grid gap-3">
				<div>
					<label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
						Nick <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={nick}
						onChange={(e) => setNick(e.target.value)}
						placeholder="Enter IRC nickname to block"
						className={inputClass}
						autoFocus
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
						Reason (optional)
					</label>
					<input
						type="text"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Why are you blocking this user?"
						className={inputClass}
					/>
				</div>
				<div className="flex gap-2 justify-end">
					<button
						type="button"
						onClick={onCancel}
						className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!nick.trim()}
						className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
					>
						Block User
					</button>
				</div>
			</div>
		</form>
	);
};

const BlocklistPanel = ({ blocklist, onBlockUser, onUnblockUser, onClose }) => {
	const [showAddForm, setShowAddForm] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const filteredBlocklist = useMemo(() => {
		if (!searchQuery.trim()) return blocklist;

		const query = searchQuery.toLowerCase();
		return blocklist.filter(
			(u) =>
				u.nick.toLowerCase().includes(query) ||
				(u.displayNick &&
					u.displayNick.toLowerCase().includes(query)) ||
				(u.reason && u.reason.toLowerCase().includes(query))
		);
	}, [blocklist, searchQuery]);

	const handleAddBlock = (nick, reason) => {
		onBlockUser(nick, reason);
		setShowAddForm(false);
	};

	return (
		<section className="flex flex-col h-full bg-white dark:bg-neutral-900">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
				<div>
					<h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
						Blocked Users
					</h2>
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						{blocklist.length}{' '}
						{blocklist.length === 1 ? 'user' : 'users'} blocked
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setShowAddForm(!showAddForm)}
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
					>
						<Plus className="w-4 h-4" />
						Block User
					</button>
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					)}
				</div>
			</div>

			{/* Add Block Form */}
			{showAddForm && (
				<AddBlockForm
					onAdd={handleAddBlock}
					onCancel={() => setShowAddForm(false)}
				/>
			)}

			{/* Search */}
			<div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search blocked users..."
						className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
					/>
				</div>
			</div>

			{/* Info banner */}
			<div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
				<p className="text-xs text-amber-700 dark:text-amber-300">
					<strong>Note:</strong> Blocked users will have their
					messages hidden from your view. This is a client-side
					feature.
				</p>
			</div>

			{/* Blocked Users List */}
			<div className="flex-1 overflow-y-auto">
				{filteredBlocklist.length > 0 ? (
					<div className="divide-y divide-neutral-100 dark:divide-neutral-800">
						{filteredBlocklist.map((user) => (
							<div
								key={user.id}
								className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
							>
								<div className="flex-shrink-0">
									<div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400">
										<Ban className="w-4 h-4" />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<span className="font-medium text-sm text-neutral-500 dark:text-neutral-400 line-through">
										{user.displayNick || user.nick}
									</span>
									{user.reason && (
										<p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
											Reason: {user.reason}
										</p>
									)}
									<p className="text-xs text-neutral-400 dark:text-neutral-500">
										Blocked on{' '}
										{new Date(
											user.blockedAt
										).toLocaleDateString()}
									</p>
								</div>
								<button
									type="button"
									onClick={() => onUnblockUser(user.id)}
									className="px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors"
								>
									Unblock
								</button>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center p-8">
						<div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
							<Ban
								className="w-8 h-8 text-neutral-400 dark:text-neutral-500"
								strokeWidth={1.5}
							/>
						</div>
						<h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
							{searchQuery
								? 'No blocked users found'
								: 'No blocked users'}
						</h3>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							{searchQuery
								? 'Try a different search term'
								: 'Users you block will appear here'}
						</p>
					</div>
				)}
			</div>
		</section>
	);
};

export { BlocklistPanel };
