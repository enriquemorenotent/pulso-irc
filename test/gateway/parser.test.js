const test = require('node:test')
const assert = require('node:assert/strict')

const { parseLine, normalizeEvent } = require('../../src/gateway/irc/parser')

test('parseLine parses tags, prefix, command, and params', () => {
  const line = '@time=2024-01-01T00:00:00Z :nick!user@host PRIVMSG #chan :hello world'
  const parsed = parseLine(line)

  assert.deepStrictEqual(parsed.tags, { time: '2024-01-01T00:00:00Z' })
  assert.deepStrictEqual(parsed.prefix, {
    nick: 'nick',
    user: 'user',
    host: 'host',
    server: null,
  })
  assert.equal(parsed.command, 'PRIVMSG')
  assert.deepStrictEqual(parsed.params, ['#chan', 'hello world'])
})

test('parseLine handles commands without tags or prefix', () => {
  const parsed = parseLine('PING :irc.example')
  assert.deepStrictEqual(parsed.tags, {})
  assert.equal(parsed.prefix, null)
  assert.equal(parsed.command, 'PING')
  assert.deepStrictEqual(parsed.params, ['irc.example'])
})

test('normalizeEvent fills defaults and uses server-time tag', () => {
  const parsed = parseLine('@time=2024-01-01T00:00:00Z PRIVMSG #chan :hi')
  const event = normalizeEvent(parsed)

  assert.equal(event.command, 'PRIVMSG')
  assert.deepStrictEqual(event.prefix, {
    nick: null,
    user: null,
    host: null,
    server: null,
  })
  assert.equal(event.target, '#chan')
  assert.equal(event.text, 'hi')
  assert.equal(event.serverTime, '2024-01-01T00:00:00Z')
})
