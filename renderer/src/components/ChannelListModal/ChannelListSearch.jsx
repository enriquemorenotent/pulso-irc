import { inputClass } from '../../ui/classes.js';

const ChannelListSearch = ({ query, onChange }) => (
	<div className="mt-4">
		<input
			className={inputClass}
			value={query}
			onChange={(event) => onChange(event.target.value)}
			placeholder="Filter channels or topics..."
		/>
	</div>
);

export { ChannelListSearch };
