import { ConnectionHeader } from './ConnectionHeader.jsx';
import { ConnectionTargets } from './ConnectionTargets.jsx';

const statusMeta = {
	idle: { color: 'text-neutral-300', bg: 'bg-neutral-300' },
	connecting: { color: 'text-amber-500', bg: 'bg-amber-500' },
	authed: { color: 'text-blue-500', bg: 'bg-blue-500' },
	connected: { color: 'text-emerald-500', bg: 'bg-emerald-500' },
	closed: { color: 'text-neutral-300', bg: 'bg-neutral-300' },
	error: { color: 'text-red-500', bg: 'bg-red-500' },
};

const ConnectionItem = ({
	connection,
	isActive,
	onSelect,
	onDisconnect,
	statusTarget,
	onTargetContextMenu,
	friendNickSet,
	onCloseDm,
	onlineNicksByConnection,
}) => {
	const statusInfo =
		statusMeta[connection.chatState.status] || statusMeta.idle;
	const isStatusActive =
		isActive && connection.chatState.active === statusTarget;
	const showDisconnect = [
		'connecting',
		'authed',
		'connected',
		'error',
	].includes(connection.chatState.status);

	return (
		<div className="mb-2">
			<ConnectionHeader
				connection={connection}
				isStatusActive={isStatusActive}
				statusTarget={statusTarget}
				statusInfo={statusInfo}
				onSelect={onSelect}
				onTargetContextMenu={onTargetContextMenu}
				showDisconnect={showDisconnect}
				onDisconnect={onDisconnect}
			/>
			<ConnectionTargets
				connection={connection}
				isActive={isActive}
				statusTarget={statusTarget}
				onSelect={onSelect}
				onTargetContextMenu={onTargetContextMenu}
				friendNickSet={friendNickSet}
				onCloseDm={onCloseDm}
				onlineNicksByConnection={onlineNicksByConnection}
			/>
		</div>
	);
};

export { ConnectionItem };
