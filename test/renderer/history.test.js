const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const loadHistoryModule = async () => {
	const modulePath = path.join(
		__dirname,
		'../../renderer/src/irc/history.js'
	);
	return import(pathToFileURL(modulePath).href);
};

const loadStateModule = async () => {
	const modulePath = path.join(__dirname, '../../renderer/src/irc/state.js');
	return import(pathToFileURL(modulePath).href);
};

test('applyHistory can skip DM targets', async () => {
	const { applyHistory } = await loadHistoryModule();
	const { createInitialChatState } = await loadStateModule();

	const history = {
		host: 'irc.example',
		order: ['#chan', 'buddy'],
		targets: {
			'#chan': {
				type: 'channel',
				messages: [
					{
						id: 'chan-1',
						time: '2026-01-01T00:00:00Z',
						type: 'message',
						from: 'alice',
						text: 'hello',
						highlight: false,
					},
				],
			},
			buddy: {
				type: 'dm',
				messages: [
					{
						id: 'dm-1',
						time: '2026-01-01T00:00:00Z',
						type: 'message',
						from: 'buddy',
						text: 'yo',
						highlight: false,
					},
				],
			},
		},
	};

	const base = createInitialChatState('me');
	const next = applyHistory(base, history, { includeDms: false });

	assert.ok(next.targets['#chan']);
	assert.equal(next.targets['#chan'].messages[0].isHistory, true);
	assert.equal(next.targets.buddy, undefined);
});

test('applyHistoryTarget merges DM history without clobbering new messages', async () => {
	const { applyHistoryTarget } = await loadHistoryModule();
	const { addOutgoingMessage, createInitialChatState } = await loadStateModule();

	const history = {
		host: 'irc.example',
		order: ['buddy'],
		targets: {
			buddy: {
				type: 'dm',
				messages: [
					{
						id: 'dm-old',
						time: '2026-01-01T00:00:00Z',
						type: 'message',
						from: 'buddy',
						text: 'old',
						highlight: false,
					},
				],
			},
		},
	};

	const base = createInitialChatState('me');
	const withNew = addOutgoingMessage(base, 'buddy', 'new');
	const newId = withNew.targets.buddy.messages[0].id;
	const next = applyHistoryTarget(withNew, history, 'buddy', 'dm');

	const messages = next.targets.buddy.messages;
	assert.equal(messages[0].id, 'dm-old');
	assert.equal(messages[messages.length - 1].id, newId);
	assert.equal(messages[0].isHistory, true);
	assert.equal(messages[messages.length - 1].isHistory, undefined);
	assert.equal(next.targets.buddy.lastReadId, 'dm-old');
	assert.equal(next.targets.buddy.historyLoaded, true);
});
