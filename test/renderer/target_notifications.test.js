const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const loadModule = async () => {
	const modulePath = path.join(
		__dirname,
		'../../renderer/src/irc/target_notifications.js'
	);
	return import(pathToFileURL(modulePath).href);
};

test('setTargetNotified stores and clears per connection', async () => {
	const { isTargetNotified, setTargetNotified } = await loadModule();

	let store = setTargetNotified({}, 'ConnA', '#General', true);
	assert.equal(isTargetNotified(store, 'conna', '#general'), true);

	store = setTargetNotified(store, 'ConnA', '#General', false);
	assert.equal(isTargetNotified(store, 'conna', '#general'), false);
	assert.equal(Object.keys(store).length, 0);
});

test('renameTargetNotified moves the saved target', async () => {
	const { isTargetNotified, setTargetNotified, renameTargetNotified } =
		await loadModule();

	let store = setTargetNotified({}, 'ConnA', 'OldNick', true);
	store = renameTargetNotified(store, 'ConnA', 'OldNick', 'NewNick');

	assert.equal(isTargetNotified(store, 'ConnA', 'OldNick'), false);
	assert.equal(isTargetNotified(store, 'ConnA', 'NewNick'), true);
});
