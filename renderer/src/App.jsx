import { useState } from 'react';
import { STATUS_TARGET } from './irc/state.js';
import { loadDefaults, loadProfiles } from './irc/storage.js';
import { useConnections } from './hooks/useConnections.js';
import { useGatewayStatus } from './hooks/useGatewayStatus.js';
import { useProfiles } from './hooks/useProfiles.js';
import { useFriends } from './hooks/useFriends.js';
import { useUserNotes } from './hooks/useUserNotes.js';
import { useTargetNotifications } from './hooks/useTargetNotifications.js';
import { useAppView } from './hooks/useAppView.js';
import { useIrcEventHandlers } from './hooks/useIrcEventHandlers.js';
import { useChannelListModal } from './hooks/useChannelListModal.js';
import { useDarkMode } from './app/useDarkMode.js';
import { useProfileActions } from './app/useProfileActions.js';
import { useConnectionActions } from './app/useConnectionActions.js';
import { useChatActions } from './app/useChatActions.js';
import { useWhoisActions } from './app/useWhoisActions.js';
import { useDmNotesActions } from './app/useDmNotesActions.js';
import { useLayoutContext } from './app/useLayoutContext.js';
import { deriveProfileState } from './app/deriveProfileState.js';
import { deriveConnectionState } from './app/deriveConnectionState.js';
import { AppLayout } from './components/AppLayout.jsx';

const App = () => {
	const { darkMode, toggleDarkMode } = useDarkMode();

	const [initialData] = useState(() => ({
		profilesState: loadProfiles(),
		defaultsState: loadDefaults(),
	}));
	const [activeView, setActiveView] = useState('connect');
	const [connectAttempted, setConnectAttempted] = useState(false);
	const [activeConnectionId, setActiveConnectionId] = useState(null);
	const [clientSecrets, setClientSecrets] = useState({});
	const [whoisState, setWhoisState] = useState(null);

	const {
		profiles,
		activeProfileId,
		activeProfile,
		defaults,
		updateDefaults,
		updateProfile,
		updateProfileById,
		updateProfileName,
		addProfile,
		switchProfile,
	} = useProfiles({
		initialProfilesState: initialData.profilesState,
		initialDefaults: initialData.defaultsState,
	});

	const friendsApi = useFriends();
	const {
		getFriend,
		isBlocked,
		getBlockedUser,
		updateFriend,
		updateBlockedUser,
	} = friendsApi;
	const { getUserNote, setUserNote } = useUserNotes();
	const targetNotifications = useTargetNotifications();

	const { handleIrcEvent, createWhoisState } = useIrcEventHandlers({
		getFriend,
		updateFriend,
		getBlockedUser,
		updateBlockedUser,
		getUserNote,
		setUserNote,
		renameTargetNotified: targetNotifications.renameTargetNotified,
		setWhoisState,
	});

	const {
		status: gatewayStatus,
		error: gatewayError,
		check: checkGateway,
	} = useGatewayStatus();
	const {
		connections,
		connect,
		disconnect,
		sendMessage,
		updateChatState,
		addStatusNote,
		flushHistorySave,
	} = useConnections({ onIrcEvent: handleIrcEvent, isBlocked });
	const {
		listModal,
		listConnection,
		listState,
		listJoinedChannels,
		openChannelList,
		closeChannelList,
		refreshChannelList,
	} = useChannelListModal({
		connections,
		updateChatState,
		sendMessage,
	});

	const profileState = deriveProfileState({
		profiles,
		activeProfileId,
		activeProfile,
		defaults,
		clientSecrets,
		gatewayStatus,
		connectAttempted,
	});

	const connectionState = deriveConnectionState({
		connections,
		profiles,
		activeConnectionId,
		selectedSettings: profileState.selectedSettings,
		defaults,
		getFriend,
		getUserNote,
	});

	const showJoinPrompt = false;

	const hasConnections = connectionState.connectionList.length > 0;
	const openConnectView = () => {
		setConnectAttempted(false);
		setActiveView('connect');
	};

	const { handleAddProfile, handleSwitchProfile, handleSecretChange } =
		useProfileActions({
			selectedProfile: profileState.selectedProfile,
			activeProfileId: profileState.activeProfileId,
			addProfile,
			switchProfile,
			setConnectAttempted,
			setClientSecrets,
		});

	const { handleConnect, handleDisconnect, handleSelectTarget } =
		useConnectionActions({
			selectedProfile: profileState.selectedProfile,
			canConnect: profileState.canConnect,
			selectedSettings: profileState.selectedSettings,
			selectedSecrets: profileState.selectedSecrets,
			connect,
			disconnect,
			connections,
			updateChatState,
			setActiveConnectionId,
			setActiveView,
			setConnectAttempted,
			activeConnectionId,
			listModal,
			closeChannelList,
		});

	const {
		handleToggleAutoJoin,
		handlePartChannel,
		handleCloseDm,
		handleOpenDm,
		handleClearTargetLogs,
		handleChannelClick,
		handleJoinFromList,
	} = useChatActions({
		connections,
		profilesById: connectionState.profilesById,
		updateProfileById,
		updateChatState,
		addStatusNote,
		sendMessage,
		listModal,
		resolvedActiveId: connectionState.resolvedActiveId,
		activeConnectionId,
		setActiveConnectionId,
		setActiveView,
		flushHistorySave,
		handleSelectTarget,
	});

	const { handleWhois, handleCloseWhois } = useWhoisActions({
		connections,
		createWhoisState,
		setWhoisState,
		sendMessage,
		resolvedActiveId: connectionState.resolvedActiveId,
	});

	const { handleSaveDmNotes } = useDmNotesActions({
		resolvedActiveId: connectionState.resolvedActiveId,
		activeDmNick: connectionState.activeDmNick,
		activeDmFriend: connectionState.activeDmFriend,
		updateFriend,
		setUserNote,
	});

	const {
		openConnect,
		openProfiles,
		openFriends,
		openBlocklist,
		openSettings,
		closeOverlay,
		onBack,
		backLabel,
	} = useAppView({
		activeView,
		setActiveView,
		hasConnections,
		onOpenConnect: openConnectView,
	});

	const onConnectServer = openConnect;
	const onManageProfiles = openProfiles;
	const onManageFriends = openFriends;
	const onManageBlocklist = openBlocklist;
	const onManageSettings = openSettings;

	const theme = { darkMode, toggleDarkMode };
	const gateway = { status: gatewayStatus, error: gatewayError, check: checkGateway };
	const appView = {
		activeView,
		backLabel,
		onBack,
		openConnect: onConnectServer,
		openProfiles: onManageProfiles,
		openFriends: onManageFriends,
		openBlocklist: onManageBlocklist,
		openSettings: onManageSettings,
		closeOverlay,
	};
	const profileActions = {
		handleAddProfile,
		handleSwitchProfile,
		handleSecretChange,
		updateProfile,
		updateProfileName,
		updateDefaults,
	};
	const connectionActions = {
		handleConnect,
		handleDisconnect,
		handleSelectTarget,
	};
	const chatActions = {
		handleToggleAutoJoin,
		handlePartChannel,
		handleCloseDm,
		handleOpenDm,
		handleClearTargetLogs,
		handleChannelClick,
		handleJoinFromList,
	};
	const whoisActions = { handleWhois, handleCloseWhois };
	const dmNotesActions = { handleSaveDmNotes };
	const channelListState = {
		listModal,
		listConnection,
		listState,
		listJoinedChannels,
		openChannelList,
		refreshChannelList,
		closeChannelList,
	};
	const messageActions = { sendMessage, addStatusNote, updateChatState };

	const { layoutProps, layoutState } = useLayoutContext({
		appView,
		theme,
		gateway,
		profileState,
		profileActions,
		connectionState,
		connectionActions,
		chatActions,
		whoisActions,
		dmNotesActions,
		friendsApi,
		channelListState,
		messageActions,
		showJoinPrompt,
		statusTarget: STATUS_TARGET,
		whoisState,
		targetNotifications,
	});

	return (
		<AppLayout
			{...layoutProps}
			{...layoutState}
		/>
	);
};

export default App;
