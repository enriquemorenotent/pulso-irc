const test = require('node:test')
const assert = require('node:assert/strict')

const { validateClientMessage } = require('../../src/gateway/validation')

test('validateClientMessage rejects non-objects', () => {
  assert.equal(validateClientMessage(null).ok, false)
  assert.equal(validateClientMessage('nope').ok, false)
  assert.equal(validateClientMessage([]).ok, false)
})

test('validateClientMessage rejects missing or empty type', () => {
  assert.equal(validateClientMessage({}).ok, false)
  assert.equal(validateClientMessage({ type: '' }).ok, false)
  assert.equal(validateClientMessage({ type: '  ' }).ok, false)
})

test('validateClientMessage accepts a valid type', () => {
  assert.deepStrictEqual(validateClientMessage({ type: 'ping' }), { ok: true })
})
