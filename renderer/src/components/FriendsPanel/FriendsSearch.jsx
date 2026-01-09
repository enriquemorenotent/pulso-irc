import { Search } from 'lucide-react';

const FriendsSearch = ({ searchQuery, onChange }) => (
	<div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
		<div className="relative">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
			<input
				type="text"
				value={searchQuery}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Search friends..."
				className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
			/>
		</div>
	</div>
);

export { FriendsSearch };
