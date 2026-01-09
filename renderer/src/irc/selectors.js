import { resolveValue } from './resolve.js';
import {
	createInitialChatState,
	STATUS_TARGET,
	sortUsers,
} from './state.js';

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

const getMissingFields = (settings, secrets) => {
	const missingFields = [];
	if (!settings.host) missingFields.push('IRC Host');
	if (!settings.nick) missingFields.push('Nick');
	if (!settings.username) missingFields.push('Username');
	if (!settings.realname) missingFields.push('Realname');
	if (settings.saslMethod === 'PLAIN' && !settings.saslPassword) {
		missingFields.push('SASL Password');
	}
	if (settings.saslMethod === 'EXTERNAL') {
		if (!secrets.clientCert) missingFields.push('Client Cert');
		if (!secrets.clientKey) missingFields.push('Client Key');
	}

	const secretFields = ['Client Cert', 'Client Key'];
	const missingNonSecretFields = missingFields.filter(
		(field) => !secretFields.includes(field)
	);
	const missingSecretFields = missingFields.filter((field) =>
		secretFields.includes(field)
	);

	return {
		missingFields,
		missingNonSecretFields,
		missingSecretFields,
	};
};

const resolveProfilesById = (profiles) =>
	profiles.reduce((acc, profile) => {
		acc[profile.id] = profile;
		return acc;
	}, {});

const resolveConnectionList = (connections, profilesById) =>
	Object.values(connections).map((connection) => ({
		...connection,
		profileName:
			profilesById[connection.profileId]?.name || connection.profileName,
		autoJoin:
			profilesById[connection.profileId]?.settings?.autoJoin ||
			connection.settings?.autoJoin ||
			'',
	}));

const resolveActiveConnection = ({
	connections,
	activeConnectionId,
	connectionList,
	selectedSettings,
}) => {
	const resolvedActiveId = connections[activeConnectionId]
		? activeConnectionId
		: connectionList[0]?.id || null;
	const activeConnection = resolvedActiveId
		? connections[resolvedActiveId]
		: null;
	const activeChatState =
		activeConnection?.chatState || createInitialChatState('');
	const activeSettings = activeConnection?.settings || selectedSettings;

	return {
		resolvedActiveId,
		activeConnection,
		activeChatState,
		activeSettings,
	};
};

const resolveActiveTarget = (activeChatState) => {
	const activeTarget =
		activeChatState.targets[activeChatState.active] ||
		activeChatState.targets[STATUS_TARGET];
	const activeUsers =
		activeTarget && activeTarget.type === 'channel'
			? sortUsers(activeTarget.users)
			: [];
	const activeDmNick = activeTarget?.type === 'dm' ? activeTarget.name : '';

	return {
		activeTarget,
		activeUsers,
		activeDmNick,
	};
};

const getActiveNicknames = (activeTarget, activeChatState) => {
	if (activeTarget?.type === 'channel') {
		return sortUsers(activeTarget.users || {}).map(([nick]) => nick);
	}
	if (activeTarget?.type === 'dm') {
		const nicksSet = new Set();
		if (activeTarget.name && activeTarget.name !== STATUS_TARGET) {
			nicksSet.add(activeTarget.name);
		}
		if (activeChatState.me) {
			nicksSet.add(activeChatState.me);
		}
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
};

export {
	buildEffectiveSettings,
	getMissingFields,
	resolveProfilesById,
	resolveConnectionList,
	resolveActiveConnection,
	resolveActiveTarget,
	getActiveNicknames,
};
