const tls = require('tls');
const { parseLine, normalizeEvent } = require('./parser');
const { createBackoff } = require('./backoff');
const { createCapabilityHandler } = require('./capabilities');
const { logInfo, logWarn, logError } = require('../logger');

const MAX_LINE_LENGTH = 512;

const createIrcConnection = (options) => {
  const {
    connId,
    host,
    port,
    nick,
    username,
    realname,
    sasl,
    caps,
    tlsOptions,
    tlsCa,
    onRaw,
    onEvent,
    onConnected,
    onDisconnected,
    onError,
  } = options;

  let socket = null;
  let buffer = '';
  let closing = false;
  let connected = false;
  let sentNickUser = false;
  let capEnabled = [];
  const backoff = createBackoff();

  const emitError = (code, message) => {
    if (onError) {
      onError({ code, message });
    }
  };

  const sendLine = (line) => {
    if (!socket || socket.destroyed) {
      return;
    }

    const payload = line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) : line;
    socket.write(`${payload}\r\n`);
  };

  const sendNickUser = () => {
    if (sentNickUser) {
      return;
    }

    sentNickUser = true;
    sendLine(`NICK ${nick}`);
    sendLine(`USER ${username} 0 * :${realname}`);
  };

  const capabilityHandler = createCapabilityHandler({
    caps,
    sasl,
    username,
    sendLine,
    onCapEnd: (enabledCaps) => {
      capEnabled = enabledCaps;
      sendLine('CAP END');
      sendNickUser();
    },
    onError: emitError,
  });

  const handleNumeric = (command) => {
    if (command === '001' && !connected) {
      connected = true;
      backoff.reset();
      if (onConnected) {
        onConnected({ server: host, capEnabled: capabilityHandler.getEnabledCaps() });
      }
      return;
    }

    capabilityHandler.handleNumeric(command);
  };

  const handleLine = (line) => {
    if (onRaw) {
      onRaw(line);
    }

    const parsed = parseLine(line);

    if (parsed.command === 'PING') {
      sendLine(`PONG ${parsed.params.join(' ')}`);
    }

    if (parsed.command === 'CAP') {
      capabilityHandler.handleCap(parsed);
    }

    if (parsed.command === 'AUTHENTICATE') {
      capabilityHandler.handleAuthenticate(parsed);
    }

    if (/^\d{3}$/.test(parsed.command)) {
      handleNumeric(parsed.command);
    }

    if (onEvent) {
      onEvent(normalizeEvent(parsed));
    }
  };

  const handleData = (chunk) => {
    buffer += chunk;

    while (buffer.includes('\r\n')) {
      const index = buffer.indexOf('\r\n');
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (line) {
        handleLine(line);
      }
    }
  };

  const scheduleReconnect = (reason) => {
    if (closing) {
      return;
    }

    const delay = backoff.nextDelay();

    if (onDisconnected) {
      onDisconnected({ reason, reconnectInMs: delay });
    }

    setTimeout(() => {
      if (!closing) {
        connect();
      }
    }, delay);
  };

  const connect = () => {
    closing = false;
    sentNickUser = false;
    buffer = '';
    connected = false;
    capEnabled = [];
    capabilityHandler.reset();

    socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: true,
        cert: tlsOptions?.cert,
        key: tlsOptions?.key,
        ca: tlsCa || undefined,
      },
      () => {
        logInfo('irc_connected', { connId, host, port });
        sendLine('CAP LS 302');
      }
    );

    socket.setEncoding('utf8');

    socket.on('data', handleData);
    socket.on('error', (error) => {
      logError('irc_socket_error', { connId, host, port, message: error.message });
      scheduleReconnect('socket_error');
    });

    socket.on('close', () => {
      if (closing) {
        if (onDisconnected) {
          onDisconnected({ reason: 'closed', reconnectInMs: 0 });
        }
        return;
      }

      logWarn('irc_socket_closed', { connId, host, port });
      scheduleReconnect('socket_closed');
    });
  };

  const close = (reason) => {
    closing = true;

    if (socket && !socket.destroyed) {
      socket.end();
    }

    if (onDisconnected) {
      onDisconnected({ reason: reason || 'closed', reconnectInMs: 0 });
    }
  };

  return {
    connect,
    sendLine,
    close,
  };
};

module.exports = {
  createIrcConnection,
};
