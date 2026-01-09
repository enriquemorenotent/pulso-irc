import { useState, useEffect, useCallback } from 'react';
import {
	createInitialChatState,
	createListState,
	markTargetRead,
	removeTarget,
	setActiveTarget,
	addOutgoingMessage,
	sortUsers,
	STATUS_TARGET,
	clearTargetMessages,
} from './irc/state.js';
import { loadDefaults, loadProfiles } from './irc/storage.js';
import { resolveValue } from './irc/resolve.js';
import { toggleAutoJoin } from './irc/auto_join.js';
import { useConnections } from './hooks/useConnections.js';
import { useGatewayStatus } from './hooks/useGatewayStatus.js';
import { useProfiles } from './hooks/useProfiles.js';
import { useFriends } from './hooks/useFriends.js';
import { useUserNotes } from './hooks/useUserNotes.js';
import { useFriendNotifications } from './hooks/useFriendNotifications.js';
import { useMessageNotifications } from './hooks/useMessageNotifications.js';
import { BlocklistPanel } from './components/BlocklistPanel.jsx';
import { Modal } from './components/Modal.jsx';
import { ChatPanel } from './components/ChatPanel.jsx';
import { ConnectionsSidebar } from './components/ConnectionsSidebar.jsx';
import { ConnectView } from './components/ConnectView.jsx';
import { FriendsPanel } from './components/FriendsPanel.jsx';
import { HeaderBar } from './components/HeaderBar.jsx';
import { NicklistPanel } from './components/NicklistPanel.jsx';
import { SetupPanel } from './components/SetupPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { DmNotesPanel } from './components/DmNotesPanel.jsx';
import { WhoisModal } from './components/WhoisModal.jsx';
import { ChannelListModal } from './components/ChannelListModal.jsx';
import { clearHistoryTarget } from './irc/history.js';

const buildEffectiveSettings = (profile, defaults) => {
	if (!profile) {
		return {
			host: '',
			connId: '',
			port: defaults?.port || '6697',
			nick: defaults?.nick || '',
			username: defaults?.username || '',
			realname: defaults?.realname || '',
			saslMethod: '',
			saslPassword: '',
			autoJoin: '',
			receiveRaw: false,
		};
	}

	const settings = profile.settings || {};
	const host = settings.host || '';
	const connId = resolveValue(settings.connId, host || profile.id);

	return {
		host,
		connId,
		port: resolveValue(settings.port, defaults.port),
		nick: resolveValue(settings.nick, defaults.nick),
		username: resolveValue(settings.username, defaults.username),
		realname: resolveValue(settings.realname, defaults.realname),
		saslMethod: settings.saslMethod || '',
		saslPassword: settings.saslPassword || '',
		autoJoin: settings.autoJoin || '',
		receiveRaw: Boolean(settings.receiveRaw),
	};
};

const WHOIS_NUMERICS = new Set([
	'301',
	'307',
	'311',
	'312',
	'313',
	'317',
	'318',
	'319',
	'330',
	'338',
	'378',
	'401',
	'671',
]);

const createWhoisState = (nick, connectionId) => ({
	nick,
	connectionId,
	status: 'loading',
	error: '',
	data: {
		nick,
		user: '',
		host: '',
		realname: '',
		server: '',
		serverInfo: '',
		account: '',
		idleSeconds: null,
		signonTime: null,
		channels: [],
		away: '',
		operator: false,
		secure: false,
		registered: false,
		extra: [],
	},
});

const App = () => {
	const [darkMode, setDarkMode] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('pulso_dark_mode');
			if (saved !== null) {
				return saved === 'true';
			}
			return window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		return false;
	});

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		localStorage.setItem('pulso_dark_mode', darkMode);
	}, [darkMode]);

	const [initialData] = useState(() => ({
		profilesState: loadProfiles(),
		defaultsState: loadDefaults(),
	}));
	const [activeView, setActiveView] = useState('connect');
	const [connectAttempted, setConnectAttempted] = useState(false);
	const [activeConnectionId, setActiveConnectionId] = useState(null);
	const [clientSecrets, setClientSecrets] = useState({});
	const [whoisState, setWhoisState] = useState(null);
	const [listModal, setListModal] = useState({
		open: false,
		connectionId: null,
	});

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

	const {
		friends,
		blocklist,
		isFriend,
		isBlocked,
		getFriend,
		getBlockedUser,
		addFriend,
		removeFriend,
		updateFriend,
		blockUser,
		unblockUser,
		updateBlockedUser,
	} = useFriends();
	const { getUserNote, setUserNote } = useUserNotes();

	const handleIrcEvent = (connectionId, event) => {
		if (!event) {
			return;
		}

		if (event.command === 'NICK') {
			const oldNick = event.prefix?.nick || event.prefix?.server || '';
			const newNick = event.params?.[0] || '';
			if (oldNick && newNick) {
				const friend = getFriend(oldNick);
				if (friend) {
					updateFriend(friend.id, { nick: newNick });
				}
				const blocked = getBlockedUser(oldNick);
				if (blocked) {
					updateBlockedUser(blocked.id, {
						nick: newNick.toLowerCase(),
						displayNick: newNick,
					});
				}
				const oldKey = oldNick.toLowerCase();
				const newKey = newNick.toLowerCase();
				if (oldKey !== newKey && connectionId) {
					const note = getUserNote(connectionId, oldNick);
					if (note) {
						setUserNote(connectionId, newNick, note);
						setUserNote(connectionId, oldNick, '');
					}
				}
			}
		}

		if (!WHOIS_NUMERICS.has(event.command)) {
			return;
		}

		setWhoisState((prev) => {
			if (!prev || prev.connectionId !== connectionId) {
				return prev;
			}

			const params = Array.isArray(event.params) ? event.params : [];
			const targetNick = params[1] || prev.nick || '';
			if (
				targetNick &&
				prev.nick &&
				targetNick.toLowerCase() !== prev.nick.toLowerCase()
			) {
				return prev;
			}

			const data = { ...prev.data };
			const extra = Array.isArray(data.extra) ? [...data.extra] : [];
			let status = prev.status;
			let error = prev.error;

			switch (event.command) {
				case '301':
					data.away = params[2] || event.text || data.away;
					break;
				case '307':
					data.registered = true;
					break;
				case '311':
					data.nick = params[1] || data.nick;
					data.user = params[2] || data.user;
					data.host = params[3] || data.host;
					data.realname = params[5] || event.text || data.realname;
					break;
				case '312':
					data.server = params[2] || data.server;
					data.serverInfo =
						params[3] || event.text || data.serverInfo;
					break;
				case '313':
					data.operator = true;
					break;
				case '317': {
					const idleSeconds = Number.parseInt(params[2], 10);
					const signonTime = Number.parseInt(params[3], 10);
					if (!Number.isNaN(idleSeconds)) {
						data.idleSeconds = idleSeconds;
					}
					if (!Number.isNaN(signonTime)) {
						data.signonTime = signonTime;
					}
					break;
				}
				case '319': {
					const channelText = params[2] || event.text || '';
					data.channels = channelText.split(' ').filter(Boolean);
					break;
				}
				case '330':
					data.account = params[2] || data.account;
					break;
				case '338':
					if (params[2]) {
						extra.push(`Actual host: ${params[2]}`);
					}
					break;
				case '378':
					if (params[2]) {
						extra.push(params[2]);
					} else if (event.text) {
						extra.push(event.text);
					}
					break;
				case '671':
					data.secure = true;
					break;
				case '401':
					status = 'error';
					error = params[2] || event.text || 'No such nick.';
					break;
				case '318':
					if (status !== 'error') {
						const hasCoreData =
							data.user ||
							data.host ||
							data.realname ||
							data.server ||
							data.account ||
							(Array.isArray(data.channels) &&
								data.channels.length > 0);
						if (!hasCoreData) {
							status = 'error';
							error = `${prev.nick} is not online.`;
						} else {
							status = 'complete';
						}
					}
					break;
				default:
					break;
			}

			data.extra = extra;

			return {
				...prev,
				status,
				error,
				data,
			};
		});
	};

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
	} = useConnections({ onIrcEvent: handleIrcEvent });

	const selectedProfile = activeProfile || profiles[0];
	const selectedSettings = buildEffectiveSettings(selectedProfile, defaults);
	const selectedSecrets = clientSecrets[selectedProfile?.id] || {
		clientCert: '',
		clientKey: '',
	};

	const missingFields = [];
	if (!selectedSettings.host) missingFields.push('IRC Host');
	if (!selectedSettings.nick) missingFields.push('Nick');
	if (!selectedSettings.username) missingFields.push('Username');
	if (!selectedSettings.realname) missingFields.push('Realname');
	if (
		selectedSettings.saslMethod === 'PLAIN' &&
		!selectedSettings.saslPassword
	) {
		missingFields.push('SASL Password');
	}
	if (selectedSettings.saslMethod === 'EXTERNAL') {
		if (!selectedSecrets.clientCert) missingFields.push('Client Cert');
		if (!selectedSecrets.clientKey) missingFields.push('Client Key');
	}

	const secretFields = ['Client Cert', 'Client Key'];
	const missingNonSecretFields = missingFields.filter(
		(field) => !secretFields.includes(field)
	);
	const missingSecretFields = missingFields.filter((field) =>
		secretFields.includes(field)
	);
	const canConnect =
		gatewayStatus === 'reachable' && missingFields.length === 0;

	const handleAddProfile = () => {
		const nextProfile = addProfile();
		if (!nextProfile) {
			return null;
		}
		setClientSecrets((prev) => ({
			...prev,
			[nextProfile.id]: { clientCert: '', clientKey: '' },
		}));
		return nextProfile;
	};

	const handleSwitchProfile = (profileId) => {
		if (profileId === activeProfileId) {
			return;
		}
		switchProfile(profileId);
		setConnectAttempted(false);
	};

	const handleConnect = () => {
		setConnectAttempted(true);
		if (!canConnect || !selectedProfile) {
			return;
		}

		connect({
			connectionId: selectedProfile.id,
			profileId: selectedProfile.id,
			profileName: selectedProfile.name,
			settings: selectedSettings,
			clientCert: selectedSecrets.clientCert,
			clientKey: selectedSecrets.clientKey,
		});

		setActiveConnectionId(selectedProfile.id);
		setActiveView('chat');
	};

	const handleDisconnect = (connectionId) => {
		disconnect(connectionId);
		if (connectionId === activeConnectionId) {
			setActiveConnectionId(null);
		}
		if (listModal.open && listModal.connectionId === connectionId) {
			setListModal({ open: false, connectionId: null });
		}
	};

	const handleSelectTarget = useCallback(
		(connectionId, targetName) => {
			if (activeConnectionId && activeConnectionId !== connectionId) {
				updateChatState(activeConnectionId, (prev) =>
					markTargetRead(prev, prev.active)
				);
			}

			setActiveConnectionId(connectionId);
			setActiveView('chat');
			updateChatState(connectionId, (prev) =>
				setActiveTarget(prev, targetName)
			);
		},
		[activeConnectionId, updateChatState]
	);

	const handleSecretChange = (updates) => {
		if (!selectedProfile) {
			return;
		}
		setClientSecrets((prev) => {
			const current = prev[selectedProfile.id] || {
				clientCert: '',
				clientKey: '',
			};
			return {
				...prev,
				[selectedProfile.id]: { ...current, ...updates },
			};
		});
	};

	const handleToggleAutoJoin = (connectionId, channel) => {
		const connection = connections[connectionId];
		if (!connection) {
			return;
		}

		const profileId = connection.profileId;
		if (!profileId) {
			return;
		}

		const currentAutoJoin =
			profilesById[profileId]?.settings?.autoJoin || '';
		const nextAutoJoin = toggleAutoJoin(currentAutoJoin, channel);
		updateProfileById(profileId, { autoJoin: nextAutoJoin });
	};

	const handlePartChannel = (connectionId, channel) => {
		const connection = connections[connectionId];
		if (!connection || !channel) {
			return;
		}

		const connId = connection.settings?.connId;
		if (!connId) {
			return;
		}

		addStatusNote(connectionId, `Leaving ${channel}...`);
		sendMessage(connectionId, {
			type: 'irc_send',
			connId,
			line: `PART ${channel}`,
		});
	};

	const handleCloseDm = (connectionId, nick) => {
		const connection = connections[connectionId];
		if (!connection || !nick) {
			return;
		}

		updateChatState(connectionId, (prev) => removeTarget(prev, nick));
	};

	const profilesById = profiles.reduce((acc, profile) => {
		acc[profile.id] = profile;
		return acc;
	}, {});
	const connectionList = Object.values(connections).map((connection) => ({
		...connection,
		profileName:
			profilesById[connection.profileId]?.name || connection.profileName,
		autoJoin:
			profilesById[connection.profileId]?.settings?.autoJoin ||
			connection.settings?.autoJoin ||
			'',
	}));

	const resolvedActiveId = connections[activeConnectionId]
		? activeConnectionId
		: connectionList[0]?.id || null;
	const activeConnection = resolvedActiveId
		? connections[resolvedActiveId]
		: null;
	const activeChatState =
		activeConnection?.chatState || createInitialChatState('');
	const activeSettings = activeConnection?.settings || selectedSettings;
	const showMediaPreviews = Boolean(defaults?.showMediaPreviews);
	const supportsEcho = Boolean(
		activeChatState.capEnabled?.includes('echo-message')
	);

	const activeTarget =
		activeChatState.targets[activeChatState.active] ||
		activeChatState.targets[STATUS_TARGET];
	const activeUsers =
		activeTarget && activeTarget.type === 'channel'
			? sortUsers(activeTarget.users)
			: [];
	const activeDmNick = activeTarget?.type === 'dm' ? activeTarget.name : '';
	const activeDmFriend = activeDmNick ? getFriend(activeDmNick) : null;
	const storedDmNote =
		activeDmNick && resolvedActiveId
			? getUserNote(resolvedActiveId, activeDmNick)
			: '';
	const activeDmNotes = activeDmFriend?.notes || storedDmNote || '';
	const activeConnectionLabel =
		activeConnection?.profileName ||
		activeConnection?.settings?.host ||
		activeChatState.server ||
		'Server';

	// Collect nicknames for TAB autocomplete
	const activeNicknames = (() => {
		if (activeTarget?.type === 'channel') {
			// For channels, use the nicklist
			return activeUsers.map(([nick]) => nick);
		}
		if (activeTarget?.type === 'dm') {
			// For DMs, collect unique nicknames from message history
			const nicksSet = new Set();
			// Add the DM target's nick
			if (activeTarget.name && activeTarget.name !== STATUS_TARGET) {
				nicksSet.add(activeTarget.name);
			}
			// Add our own nick
			if (activeChatState.me) {
				nicksSet.add(activeChatState.me);
			}
			// Add nicks from message senders
			if (Array.isArray(activeTarget.messages)) {
				activeTarget.messages.forEach((msg) => {
					if (msg.from && msg.from !== activeChatState.me) {
						nicksSet.add(msg.from);
					}
				});
			}
			return Array.from(nicksSet);
		}
		return [];
	})();

	const isChannelTarget = Boolean(
		activeTarget?.type === 'channel' ||
			(activeTarget?.name &&
				(activeTarget.name.startsWith('#') ||
					activeTarget.name.startsWith('&')))
	);
	const showNicklist = isChannelTarget;
	const showDmNotes = activeTarget?.type === 'dm';
	const showJoinPrompt = false;
	const needsSecrets = missingSecretFields.length > 0;

	const hasConnections = connectionList.length > 0;
	const openConnectView = () => {
		setConnectAttempted(false);
		setActiveView('connect');
	};

	const onBack = (() => {
		if (activeView === 'chat') return null;
		if (hasConnections) return () => setActiveView('chat');
		if (activeView === 'profiles') return openConnectView;
		return null;
	})();

	const backLabel = onBack
		? hasConnections
			? 'Back to Chat'
			: 'Back to Connections'
		: null;

	const onConnectServer = openConnectView;
	const onManageProfiles = () => setActiveView('profiles');
	const onManageFriends = () => setActiveView('friends');
	const onManageBlocklist = () => setActiveView('blocklist');
	const onManageSettings = () => setActiveView('settings');

	const closeOverlay = () => {
		setActiveView(hasConnections ? 'chat' : 'connect');
	};

	const activeSendMessage = resolvedActiveId
		? (payload) => sendMessage(resolvedActiveId, payload)
		: () => {};
	const activeAddStatusNote = resolvedActiveId
		? (text) => addStatusNote(resolvedActiveId, text)
		: () => {};

	const activeAddOutgoing = resolvedActiveId
		? (target, text, type) =>
				updateChatState(resolvedActiveId, (prev) =>
					addOutgoingMessage(prev, target, text, type, {
						from: activeSettings.nick || prev.me,
					})
				)
		: () => {};

	const handleOpenDm = (nick, connectionId = null) => {
		// Use provided connectionId, or fall back to active connection
		const targetConnectionId = connectionId || resolvedActiveId;
		if (!targetConnectionId || !nick) {
			return;
		}
		// Switch to the target connection if different
		if (connectionId && connectionId !== activeConnectionId) {
			setActiveConnectionId(connectionId);
		}
		updateChatState(targetConnectionId, (prev) => {
			return setActiveTarget(prev, nick, 'dm');
		});
	};

	const handleWhois = (nick, connectionId = null) => {
		const targetConnectionId = connectionId || resolvedActiveId;
		if (!targetConnectionId || !nick) {
			return;
		}
		const connection = connections[targetConnectionId];
		const connId = connection?.settings?.connId;
		if (!connId) {
			setWhoisState({
				...createWhoisState(nick, targetConnectionId),
				status: 'error',
				error: 'No active connection.',
			});
			return;
		}
		setWhoisState(createWhoisState(nick, targetConnectionId));
		sendMessage(targetConnectionId, {
			type: 'irc_send',
			connId,
			line: `WHOIS ${nick}`,
		});
	};

	const handleCloseWhois = () => {
		setWhoisState(null);
	};

	const buildLoadingListState = () =>
		createListState({ status: 'loading', error: '' });

	const resetListState = (connectionId) => {
		if (!connectionId) {
			return false;
		}
		if (!connections[connectionId]) {
			return false;
		}
		updateChatState(connectionId, (prev) => ({
			...prev,
			list: buildLoadingListState(),
		}));
		return true;
	};

	const canSendList = (connectionId) => {
		const connection = connections[connectionId];
		if (!connection) {
			return false;
		}
		if (connection.chatState?.status !== 'connected') {
			return false;
		}
		return Boolean(connection.settings?.connId);
	};

	const sendListRequest = (connectionId) => {
		if (!canSendList(connectionId)) {
			return false;
		}
		const connection = connections[connectionId];
		const connId = connection.settings?.connId;
		if (!connId) {
			return false;
		}
		sendMessage(connectionId, {
			type: 'irc_send',
			connId,
			line: 'LIST',
		});
		return true;
	};

	const handleOpenChannelList = (connectionId, options = {}) => {
		if (!connectionId) {
			return;
		}
		setListModal({ open: true, connectionId });
		const shouldReset = Boolean(options.reset);
		const shouldSend = Boolean(options.sendList);
		if (shouldReset) {
			resetListState(connectionId);
		}
		if (shouldSend) {
			if (shouldReset && !canSendList(connectionId)) {
				updateChatState(connectionId, (prev) => ({
					...prev,
					list: createListState({
						...(prev.list || {}),
						status: 'error',
						error: 'Not connected.',
					}),
				}));
				return;
			}
			sendListRequest(connectionId);
		}
	};

	const handleCloseChannelList = () => {
		setListModal({ open: false, connectionId: null });
	};

	const handleRefreshChannelList = () => {
		if (!listModal.connectionId) {
			return;
		}
		if (!canSendList(listModal.connectionId)) {
			updateChatState(listModal.connectionId, (prev) => ({
				...prev,
				list: createListState({
					...(prev.list || {}),
					status: 'error',
					error: 'Not connected.',
				}),
			}));
			return;
		}
		resetListState(listModal.connectionId);
		sendListRequest(listModal.connectionId);
	};

	const handleClearTargetLogs = (connectionId, targetName) => {
		if (!connectionId || !targetName) {
			return;
		}
		if (targetName === STATUS_TARGET) {
			return;
		}
		const connection = connections[connectionId];
		const host = connection?.settings?.host || '';

		// Update state to clear messages
		updateChatState(connectionId, (prev) =>
			clearTargetMessages(prev, targetName)
		);

		// Flush any pending history save to immediately persist the cleared state
		// This ensures the cleared state is saved before any new messages arrive
		flushHistorySave(connectionId);

		// Also clear the target from the persisted storage structure
		clearHistoryTarget(connectionId, host, targetName);
	};

	const handleSaveDmNotes = (value) => {
		if (!resolvedActiveId || !activeDmNick) {
			return;
		}
		const trimmed = (value || '').trim();
		if (activeDmFriend) {
			updateFriend(activeDmFriend.id, { notes: trimmed });
			setUserNote(resolvedActiveId, activeDmNick, '');
			return;
		}
		setUserNote(resolvedActiveId, activeDmNick, trimmed);
	};

	const joinChannel = (connectionId, channelName) => {
		if (!connectionId || !channelName) {
			return;
		}
		const connection = connections[connectionId];
		const connId = connection?.settings?.connId;
		if (!connId) {
			return;
		}

		updateChatState(connectionId, (prev) => {
			return setActiveTarget(prev, channelName, 'channel');
		});
		addStatusNote(connectionId, `Joining ${channelName}...`);
		sendMessage(connectionId, {
			type: 'irc_send',
			connId,
			line: `JOIN ${channelName}`,
		});
	};

	const handleChannelClick = (channelName) => {
		if (!resolvedActiveId || !channelName) {
			return;
		}
		const activeConnectionState = connections[resolvedActiveId]?.chatState;
		if (activeConnectionState?.targets?.[channelName]) {
			handleSelectTarget(resolvedActiveId, channelName);
			return;
		}
		joinChannel(resolvedActiveId, channelName);
	};

	const handleJoinFromList = (channelName) => {
		if (!channelName) {
			return;
		}
		const connectionId =
			listModal.connectionId || resolvedActiveId || null;
		if (!connectionId) {
			return;
		}
		const connectionState = connections[connectionId]?.chatState;
		if (connectionState?.targets?.[channelName]) {
			handleSelectTarget(connectionId, channelName);
			setActiveView('chat');
			return;
		}
		joinChannel(connectionId, channelName);
		setActiveView('chat');
		if (connectionId !== activeConnectionId) {
			setActiveConnectionId(connectionId);
		}
	};

	// Friend online notifications
	const {
		notificationsEnabled,
		notificationsPermission,
		notificationsSupported,
		requestNotificationPermission,
		toggleNotifications,
	} = useFriendNotifications(
		friends,
		connectionList,
		isBlocked,
		handleOpenDm
	);

	const listConnection = listModal.open
		? connections[listModal.connectionId]
		: null;
	const listChatState = listConnection?.chatState || null;
	const listState = listChatState?.list || {
		status: 'idle',
		items: [],
		total: 0,
		truncated: false,
		error: '',
	};
	const listJoinedChannels = (() => {
		if (!listChatState) {
			return new Set();
		}
		const joined = new Set();
		Object.entries(listChatState.targets || {}).forEach(([name, target]) => {
			if (target.type === 'channel' && target.joined) {
				joined.add(name.toLowerCase());
			}
		});
		return joined;
	})();

	// Message notifications (mentions and DMs)
	useMessageNotifications(
		connectionList,
		handleSelectTarget,
		notificationsEnabled
	);

	const setupPanelNode = (
		<SetupPanel
			defaults={defaults}
			profiles={profiles}
			activeProfileId={activeProfileId}
			onSwitchProfile={handleSwitchProfile}
			onAddProfile={handleAddProfile}
			activeProfile={activeProfile}
			updateProfile={updateProfile}
			updateProfileName={updateProfileName}
			error={activeChatState.error}
		/>
	);

	const settingsPanelNode = (
		<SettingsPanel defaults={defaults} updateDefaults={updateDefaults} />
	);

	const connectViewNode = (
		<ConnectView
			profiles={profiles}
			activeProfileId={activeProfileId}
			onSelectProfile={handleSwitchProfile}
			effectiveSettings={selectedSettings}
			missingNonSecretFields={missingNonSecretFields}
			needsSecrets={needsSecrets}
			clientCert={selectedSecrets.clientCert}
			setClientCert={(value) => handleSecretChange({ clientCert: value })}
			clientKey={selectedSecrets.clientKey}
			setClientKey={(value) => handleSecretChange({ clientKey: value })}
			showValidation={connectAttempted}
			onConnect={handleConnect}
			error={activeChatState.error}
		/>
	);

	return (
		<main className="h-screen w-screen flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
			<HeaderBar
				backLabel={onBack ? backLabel : null}
				onBack={onBack}
				onConnectServer={onConnectServer}
				onManageProfiles={onManageProfiles}
				onManageFriends={onManageFriends}
				onManageBlocklist={onManageBlocklist}
				onManageSettings={onManageSettings}
				activeView={activeView}
				darkMode={darkMode}
				onToggleDarkMode={() => setDarkMode(!darkMode)}
				gatewayStatus={gatewayStatus}
				gatewayError={gatewayError}
				onCheckGateway={checkGateway}
			/>

			<div className="flex-1 min-h-0 flex overflow-hidden w-full">
				<ConnectionsSidebar
					connections={connectionList}
					activeConnectionId={resolvedActiveId}
					onSelectTarget={handleSelectTarget}
					onDisconnect={handleDisconnect}
					statusTarget={STATUS_TARGET}
					onToggleAutoJoin={handleToggleAutoJoin}
					onPartChannel={handlePartChannel}
					onCloseDm={handleCloseDm}
					friends={friends}
					isBlocked={isBlocked}
					isFriend={isFriend}
					onAddFriend={addFriend}
					onRemoveFriend={removeFriend}
					onBlockUser={blockUser}
					onUnblockUser={unblockUser}
					onOpenDm={handleOpenDm}
					onWhois={handleWhois}
					onClearLogs={handleClearTargetLogs}
					onOpenChannelList={handleOpenChannelList}
				/>

				<div className="flex-1 flex flex-col min-w-0 bg-neutral-50 relative dark:bg-neutral-950">
					{!hasConnections || activeView === 'connect' ? (
						connectViewNode
					) : (
						<div className="flex-1 flex overflow-hidden">
							<ChatPanel
								activeTarget={activeTarget}
								chatState={activeChatState}
								showJoinPrompt={showJoinPrompt}
								onChannelClick={handleChannelClick}
								onOpenDm={handleOpenDm}
								onWhois={handleWhois}
								isFriend={isFriend}
								isBlocked={isBlocked}
								onAddFriend={addFriend}
								onRemoveFriend={removeFriend}
								onBlockUser={blockUser}
								onUnblockUser={unblockUser}
								effectiveSettings={activeSettings}
								showMediaPreviews={showMediaPreviews}
								sendMessage={activeSendMessage}
								addStatusNote={activeAddStatusNote}
								addOutgoingMessage={activeAddOutgoing}
								supportsEcho={supportsEcho}
								nicknames={activeNicknames}
								onOpenChannelList={() =>
									handleOpenChannelList(resolvedActiveId, {
										reset: true,
									})
								}
							/>

							{showNicklist ? (
								<NicklistPanel
									activeUsers={activeUsers}
									activeTarget={activeTarget}
									chatState={activeChatState}
									onOpenDm={handleOpenDm}
									onWhois={handleWhois}
									isFriend={isFriend}
									isBlocked={isBlocked}
									onAddFriend={addFriend}
									onRemoveFriend={removeFriend}
									onBlockUser={blockUser}
									onUnblockUser={unblockUser}
								/>
							) : showDmNotes ? (
								<DmNotesPanel
									key={`${activeDmNick}:${activeDmNotes}`}
									nick={activeDmNick}
									connectionLabel={activeConnectionLabel}
									isFriend={Boolean(activeDmFriend)}
									notes={activeDmNotes}
									onSaveNotes={handleSaveDmNotes}
								/>
							) : null}
						</div>
					)}

					{activeView === 'profiles' && (
						<Modal title="Servers" onClose={closeOverlay}>
							{setupPanelNode}
						</Modal>
					)}

					{activeView === 'settings' && (
						<Modal title="Settings" onClose={closeOverlay}>
							{settingsPanelNode}
						</Modal>
					)}

					{activeView === 'friends' && (
						<Modal title="Friends" onClose={closeOverlay}>
							<FriendsPanel
								friends={friends}
								onRemoveFriend={removeFriend}
								onUpdateFriend={updateFriend}
								onOpenDm={handleOpenDm}
								onClose={closeOverlay}
								notificationsEnabled={notificationsEnabled}
								notificationsPermission={notificationsPermission}
								notificationsSupported={notificationsSupported}
								onRequestNotificationPermission={
									requestNotificationPermission
								}
								onToggleNotifications={toggleNotifications}
							/>
						</Modal>
					)}

					{activeView === 'blocklist' && (
						<Modal title="Blocked Users" onClose={closeOverlay}>
							<BlocklistPanel
								blocklist={blocklist}
								onBlockUser={blockUser}
								onUnblockUser={unblockUser}
								onClose={closeOverlay}
							/>
						</Modal>
					)}

					{whoisState && (
						<Modal
							title={`WHOIS ${whoisState.nick}`}
							onClose={handleCloseWhois}
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
							onClose={handleCloseChannelList}
						>
							<ChannelListModal
								listState={listState}
								joinedChannels={listJoinedChannels}
								onJoin={handleJoinFromList}
								onRefresh={handleRefreshChannelList}
							/>
						</Modal>
					)}
				</div>
			</div>
		</main>
	);
};

export default App;
