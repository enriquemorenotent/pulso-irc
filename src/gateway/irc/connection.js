const tls = require('tls');
const { parseLine, normalizeEvent } = require('./parser');
const { logInfo, logWarn, logError } = require('../logger');

const MAX_LINE_LENGTH = 512;

const createBackoff = () => {
  let attempt = 0;

  const reset = () => {
    attempt = 0;
  };

  const nextDelay = () => {
    attempt += 1;
    const delay = 1000 * Math.pow(2, attempt - 1);
    return Math.min(delay, 30000);
  };

  return { reset, nextDelay };
};

const base64Encode = (value) => Buffer.from(value, 'utf8').toString('base64');

const buildSaslResponse = ({ method, username, password, authzid }) => {
  if (method === 'PLAIN') {
    const user = authzid || username || '';
    const payload = `\u0000${user}\u0000${password || ''}`;
    return base64Encode(payload);
  }

  if (method === 'EXTERNAL') {
    const payload = authzid || '';
    return base64Encode(payload);
  }

  return '';
};

const parseCapList = (raw) => {
  if (!raw) {
    return [];
  }

  return raw
    .split(' ')
    .map((cap) => cap.trim())
    .filter(Boolean);
};

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
  let saslState = 'idle';
  let capRequested = new Set(caps || []);
  let capEnabled = new Set();
  let capOffered = new Set();
  let capLsComplete = false;
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

  const finishCap = () => {
    sendLine('CAP END');
    sendNickUser();
  };

  const startSasl = () => {
    if (!sasl || !sasl.method) {
      finishCap();
      return;
    }

    saslState = 'requested';
    sendLine(`AUTHENTICATE ${sasl.method}`);
  };

  const handleAuthenticate = (parsed) => {
    if (saslState !== 'requested') {
      return;
    }

    const payload = parsed.params[0];
    if (payload !== '+') {
      emitError('sasl_unexpected', 'Unexpected SASL payload');
      return;
    }

    const response = buildSaslResponse({
      method: sasl.method,
      username,
      password: sasl.password,
      authzid: sasl.authzid,
    });

    if (!response) {
      emitError('sasl_unsupported', 'Unsupported SASL method');
      return;
    }

    saslState = 'in_progress';
    sendLine(`AUTHENTICATE ${response}`);
  };

  const handleCapLs = (parsed) => {
    const capListRaw = parsed.params[parsed.params.length - 1] || '';
    const hasMore = parsed.params[2] === '*';
    const offered = parseCapList(capListRaw);

    offered.forEach((cap) => capOffered.add(cap));

    if (hasMore) {
      return;
    }

    capLsComplete = true;
    const requested = Array.from(capOffered).filter((cap) => capRequested.has(cap));

    if (requested.length > 0) {
      sendLine(`CAP REQ :${requested.join(' ')}`);
    } else {
      finishCap();
    }
  };

  const handleCap = (parsed) => {
    const subCommand = parsed.params[1];

    if (subCommand === 'LS') {
      handleCapLs(parsed);
      return;
    }

    if (subCommand === 'ACK') {
      const capListRaw = parsed.params.slice(2).join(' ');
      const enabled = parseCapList(capListRaw);
      enabled.forEach((cap) => capEnabled.add(cap));

      if (capEnabled.has('sasl')) {
        startSasl();
        return;
      }

      finishCap();
      return;
    }

    if (subCommand === 'NAK') {
      emitError('cap_nak', 'Requested capabilities were rejected');
      if (capLsComplete) {
        finishCap();
      }
    }
  };

  const handleNumeric = (command) => {
    if (command === '001' && !connected) {
      connected = true;
      backoff.reset();
      if (onConnected) {
        onConnected({ server: host, capEnabled: Array.from(capEnabled) });
      }
      return;
    }

    if (command === '903') {
      saslState = 'done';
      finishCap();
      return;
    }

    if (['904', '905', '906', '907'].includes(command)) {
      saslState = 'failed';
      emitError('sasl_failed', 'SASL authentication failed');
      finishCap();
    }
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
      handleCap(parsed);
    }

    if (parsed.command === 'AUTHENTICATE') {
      handleAuthenticate(parsed);
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
    saslState = 'idle';
    capOffered = new Set();
    capLsComplete = false;

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
