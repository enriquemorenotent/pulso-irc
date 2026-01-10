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

test('validateClientMessage validates connect payloads', () => {
  const base = {
    type: 'connect',
    connId: 'conn-1',
    host: 'irc.example',
    port: 6697,
    tls: true,
    nick: 'nick',
    username: 'user',
    realname: 'Real Name',
  }

  assert.equal(validateClientMessage(base).ok, true)
  assert.equal(validateClientMessage({ ...base, port: 70000 }).ok, false)
  assert.equal(validateClientMessage({ ...base, tls: false }).ok, false)
  assert.equal(
    validateClientMessage({
      ...base,
      sasl: { method: 'EXTERNAL' },
      clientCert: 'cert',
    }).ok,
    false
  )
})

test('validateClientMessage validates irc_send payloads', () => {
  assert.equal(
    validateClientMessage({ type: 'irc_send', connId: 'c1', line: 'PING :x' }).ok,
    true
  )
  assert.equal(
    validateClientMessage({ type: 'irc_send', connId: 'c1', line: '   ' }).ok,
    false
  )
  assert.equal(
    validateClientMessage({ type: 'irc_send', connId: 'c1', line: 'hi\nthere' }).ok,
    false
  )
})

test('validateClientMessage validates disconnect and ping payloads', () => {
  assert.equal(validateClientMessage({ type: 'disconnect', connId: 'c1' }).ok, true)
  assert.equal(validateClientMessage({ type: 'disconnect' }).ok, false)
  assert.equal(validateClientMessage({ type: 'ping' }).ok, true)
  assert.equal(validateClientMessage({ type: 'ping', nonce: 123 }).ok, false)
})
