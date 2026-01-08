const test = require('node:test')
const assert = require('node:assert/strict')
const tls = require('node:tls')
const fs = require('node:fs')
const path = require('node:path')

const { createSession } = require('../../src/gateway/session')
const { loadConfig } = require('../../src/gateway/config')

const fixturesDir = path.join(__dirname, '..', 'fixtures')
const caPath = path.join(fixturesDir, 'irc-test-ca.pem')
const certPath = path.join(fixturesDir, 'irc-test-server.pem')
const keyPath = path.join(fixturesDir, 'irc-test-server.key')

const waitFor = (predicate, timeoutMs = 2000) =>
  new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      const found = predicate()
      if (found) {
        resolve(found)
        return
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Timed out waiting for condition'))
        return
      }
      setTimeout(tick, 10)
    }
    tick()
  })

const createIrcServer = async () => {
  const server = tls.createServer(
    {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
    (socket) => {
      socket.setEncoding('utf8')

      const state = {
        nick: '',
        gotNick: false,
        gotUser: false,
        welcomed: false,
      }

      const sendLine = (line) => {
        socket.write(`${line}\r\n`)
      }

      let buffer = ''
      const handleLine = (line) => {
        if (line.startsWith('CAP LS')) {
          sendLine(':irc.test CAP * LS :')
          return
        }

        if (line.startsWith('NICK ')) {
          state.nick = line.slice(5).trim()
          state.gotNick = true
        }

        if (line.startsWith('USER ')) {
          state.gotUser = true
        }

        if (state.gotNick && state.gotUser && !state.welcomed) {
          state.welcomed = true
          sendLine(`:irc.test 001 ${state.nick} :Welcome to IRC`)
          sendLine(`:someone!user@host PRIVMSG #test :hello`)
        }
      }

      socket.on('data', (chunk) => {
        buffer += chunk
        while (buffer.includes('\r\n')) {
          const index = buffer.indexOf('\r\n')
          const line = buffer.slice(0, index)
          buffer = buffer.slice(index + 2)
          if (line) {
            handleLine(line)
          }
        }
      })
    }
  )

  await new Promise((resolve, reject) => {
    const onError = (error) => reject(error)
    server.once('error', onError)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', onError)
      resolve()
    })
  })

  return {
    server,
    port: server.address().port,
  }
}

test('gateway session connects to TLS IRC server and receives events', async (t) => {
  let server
  let port
  try {
    const info = await createIrcServer()
    server = info.server
    port = info.port
  } catch (error) {
    if (error?.code === 'EPERM' || error?.code === 'EACCES') {
      t.skip('Network sockets not available in this environment')
      return
    }
    throw error
  }
  process.env.IRC_TLS_CA_PATH = caPath
  const config = loadConfig()

  const messages = []
  const session = createSession({
    send: (message) => messages.push(message),
    onClose: () => {},
    config,
    ip: 'test',
  })

  session.start()
  session.handleMessage({
    type: 'connect',
    connId: 'test-conn',
    host: '127.0.0.1',
    port,
    tls: true,
    nick: 'tester',
    username: 'tester',
    realname: 'Tester',
    caps: [],
  })

  const connected = await waitFor(
    () => messages.find((message) => message.type === 'connected'),
    3000
  )
  assert.equal(connected.type, 'connected')

  const event = await waitFor(
    () =>
      messages.find(
        (message) =>
          message.type === 'irc_event' && message.command === 'PRIVMSG'
      ),
    3000
  )
  assert.equal(event.command, 'PRIVMSG')

  session.close('test_done')
  await new Promise((resolve) => server.close(resolve))
})
