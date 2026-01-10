const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const loadGatewayHandlers = async () => {
	const modulePath = path.join(
		__dirname,
		'../../renderer/src/hooks/useConnections/gatewayHandlers.js'
	);
	const moduleUrl = pathToFileURL(modulePath).href;
	return import(moduleUrl);
};

const createMessageEvent = (payload) => ({
	data: JSON.stringify(payload),
});

const createHandler = async ({ isBlocked }) => {
	const { createGatewayMessageHandler } = await loadGatewayHandlers();
	const calls = { updateChatState: 0, addStatusNote: 0, sendMessage: 0 };
	return {
		calls,
		handler: createGatewayMessageHandler({
			connectionId: 'conn-1',
			settings: {
				connId: 'conn-1',
				host: 'irc.example',
				port: '6697',
				nick: 'pulso',
				username: 'pulso',
				realname: 'Pulso IRC',
				saslMethod: '',
				saslPassword: '',
				autoJoin: '',
				receiveRaw: false,
			},
			clientCert: null,
			clientKey: null,
			sendMessage: () => {
				calls.sendMessage += 1;
			},
			updateChatState: () => {
				calls.updateChatState += 1;
			},
			addStatusNote: () => {
				calls.addStatusNote += 1;
			},
			onIrcEventRef: { current: () => {} },
			isBlocked,
			pendingJoinsRef: { current: {} },
			nickRetryRef: { current: {} },
			connectedAtRef: { current: { 'conn-1': Date.now() } },
		}),
	};
};

test('blocked PRIVMSG is suppressed before state update', async () => {
	const { handler, calls } = await createHandler({
		isBlocked: (nick) => nick.toLowerCase() === 'badguy',
	});

	handler(
		createMessageEvent({
			type: 'irc_event',
			command: 'PRIVMSG',
			prefix: { nick: 'BadGuy' },
			target: '#pulso',
			text: 'hello',
			tags: {},
		})
	);

	assert.equal(calls.updateChatState, 0);
});

test('unblocked PRIVMSG proceeds to state update', async () => {
	const { handler, calls } = await createHandler({
		isBlocked: () => false,
	});

	handler(
		createMessageEvent({
			type: 'irc_event',
			command: 'PRIVMSG',
			prefix: { nick: 'Friend' },
			target: '#pulso',
			text: 'hello',
			tags: {},
		})
	);

	assert.equal(calls.updateChatState, 1);
});
