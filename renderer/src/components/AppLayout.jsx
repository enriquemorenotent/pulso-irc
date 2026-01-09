import { BlocklistPanel } from './BlocklistPanel.jsx';
import { Modal } from './Modal.jsx';
import { ChatPanel } from './ChatPanel.jsx';
import { ConnectionsSidebar } from './ConnectionsSidebar.jsx';
import { ConnectView } from './ConnectView.jsx';
import { FriendsPanel } from './FriendsPanel.jsx';
import { HeaderBar } from './HeaderBar.jsx';
import { NicklistPanel } from './NicklistPanel.jsx';
import { SetupPanel } from './SetupPanel.jsx';
import { SettingsPanel } from './SettingsPanel.jsx';
import { DmNotesPanel } from './DmNotesPanel.jsx';
import { WhoisModal } from './WhoisModal.jsx';
import { ChannelListModal } from './ChannelListModal.jsx';

const AppLayout = ({
	headerProps,
	sidebarProps,
	connectViewProps,
	setupPanelProps,
	settingsPanelProps,
	friendsPanelProps,
	blocklistPanelProps,
	chatPanelProps,
	nicklistProps,
	dmNotesProps,
	activeView,
	hasConnections,
	showNicklist,
	showDmNotes,
	closeOverlay,
	whoisState,
	onCloseWhois,
	listModal,
	listConnection,
	channelListProps,
	closeChannelList,
}) => {
	return (
		<main className="h-screen w-screen flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
			<HeaderBar {...headerProps} />

			<div className="flex-1 min-h-0 flex overflow-hidden w-full">
				<ConnectionsSidebar {...sidebarProps} />

				<div className="flex-1 flex flex-col min-w-0 bg-neutral-50 relative dark:bg-neutral-950">
					{!hasConnections || activeView === 'connect' ? (
						<ConnectView {...connectViewProps} />
					) : (
						<div className="flex-1 flex overflow-hidden">
							<ChatPanel {...chatPanelProps} />

							{showNicklist ? (
								<NicklistPanel {...nicklistProps} />
							) : showDmNotes ? (
								<DmNotesPanel {...dmNotesProps} />
							) : null}
						</div>
					)}

					{activeView === 'profiles' && (
						<Modal title="Servers" onClose={closeOverlay}>
							<SetupPanel {...setupPanelProps} />
						</Modal>
					)}

					{activeView === 'settings' && (
						<Modal title="Settings" onClose={closeOverlay}>
							<SettingsPanel {...settingsPanelProps} />
						</Modal>
					)}

					{activeView === 'friends' && (
						<Modal title="Friends" onClose={closeOverlay}>
							<FriendsPanel {...friendsPanelProps} />
						</Modal>
					)}

					{activeView === 'blocklist' && (
						<Modal title="Blocked Users" onClose={closeOverlay}>
							<BlocklistPanel {...blocklistPanelProps} />
						</Modal>
					)}

					{whoisState && (
						<Modal
							title={`WHOIS ${whoisState.nick}`}
							onClose={onCloseWhois}
						>
							<WhoisModal whois={whoisState} />
						</Modal>
					)}

					{listModal.open && (
						<Modal
							title={
								listConnection?.profileName
									? `Channel List (${listConnection.profileName})`
									: 'Channel List'
							}
							onClose={closeChannelList}
						>
							<ChannelListModal {...channelListProps} />
						</Modal>
					)}
				</div>
			</div>
		</main>
	);
};

export { AppLayout };
