const { randomUUID } = require('crypto');
const { createRateLimiter } = require('./rate_limit');
const { createIrcConnection } = require('./irc/connection');
const { isIrcHostAllowed } = require('./config');
const { validateClientMessage } = require('./validation');
const { logInfo, logWarn } = require('./logger');

const MAX_MESSAGE_SIZE = 64 * 1024;

const createSession = ({ send, onClose, config, ip }) => {
  const connections = new Map();
  const limiter = createRateLimiter({
    limit: config.maxCommandsPerSecond,
    windowMs: 1000,
  });
  let closed = false;

  const sendEnvelope = (type, payload = {}, envelope = {}) => {
    const message = {
      type,
      id: randomUUID(),
      time: new Date().toISOString(),
      ...envelope,
      ...payload,
    };

    send(message);
  };

  const sendError = (code, message, envelope = {}) => {
    sendEnvelope('error', { code, message, fatal: false }, envelope);
  };

  const handleConnect = (message) => {
    if (!message.connId || typeof message.connId !== 'string') {
      sendError('invalid_conn_id', 'connId is required');
      return;
    }

    if (connections.has(message.connId)) {
      sendError('conn_exists', 'connId already exists', { connId: message.connId });
      return;
    }

    if (connections.size >= config.maxConnectionsPerClient) {
      sendError('conn_limit', 'Connection limit reached');
      return;
    }

    if (typeof message.host !== 'string' || message.host.trim() === '') {
      logWarn('irc_host_invalid', {
        connId: message.connId,
        host: message.host,
        hostType: typeof message.host,
      });
      sendError('invalid_host', 'host is required', { connId: message.connId });
      return;
    }

    const rawHost = message.host;
    const trimmedHost = rawHost.trim();
    const caps = Array.isArray(message.caps) ? message.caps : [];
    const receiveRaw = Boolean(message.options?.receiveRaw);

    logInfo('connect_received', {
      connId: message.connId,
      host: rawHost,
      hostTrimmed: trimmedHost,
      port: message.port || 6697,
      tls: Boolean(message.tls),
      saslMethod: message.sasl?.method || null,
      capsCount: caps.length,
      receiveRaw,
    });

    if (!isIrcHostAllowed(config, message.host)) {
      logWarn('irc_host_rejected', {
        connId: message.connId,
        host: rawHost,
        hostTrimmed: trimmedHost,
        allowedIrcHosts: config.allowedIrcHosts,
        allowAnyIrcHost: config.allowAnyIrcHost,
      });
      sendError('host_not_allowed', 'IRC host not allowed', { connId: message.connId });
      return;
    }

    if (!message.tls) {
      logWarn('irc_tls_required', { connId: message.connId, host: rawHost });
      sendError('tls_required', 'TLS is required', { connId: message.connId });
      return;
    }

    if (typeof message.nick !== 'string' || message.nick.trim() === '') {
      sendError('invalid_nick', 'nick is required', { connId: message.connId });
      return;
    }

    if (typeof message.username !== 'string' || message.username.trim() === '') {
      sendError('invalid_username', 'username is required', { connId: message.connId });
      return;
    }

    if (typeof message.realname !== 'string' || message.realname.trim() === '') {
      sendError('invalid_realname', 'realname is required', { connId: message.connId });
      return;
    }

    const port = Number.parseInt(message.port || 6697, 10);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      sendError('invalid_port', 'port must be a valid integer', { connId: message.connId });
      return;
    }

    if (message.sasl) {
      if (typeof message.sasl.method !== 'string') {
        sendError('invalid_sasl', 'sasl.method is required', { connId: message.connId });
        return;
      }

      const allowedMethods = new Set(['PLAIN', 'EXTERNAL']);
      if (!allowedMethods.has(message.sasl.method)) {
        sendError('invalid_sasl', 'Unsupported SASL method', { connId: message.connId });
        return;
      }

      if (message.sasl.method === 'PLAIN') {
        if (typeof message.sasl.password !== 'string') {
          sendError('invalid_sasl', 'sasl.password is required for PLAIN', { connId: message.connId });
          return;
        }
      }

      if (message.sasl.method === 'EXTERNAL') {
        if (!message.clientCert || !message.clientKey) {
          sendError('invalid_sasl', 'clientCert and clientKey are required for EXTERNAL', { connId: message.connId });
          return;
        }
      }
    }

    const tlsOptions = message.clientCert && message.clientKey
      ? {
          cert: Buffer.from(message.clientCert, 'base64'),
          key: Buffer.from(message.clientKey, 'base64'),
        }
      : null;

    const connection = createIrcConnection({
      connId: message.connId,
      host: message.host,
      port,
      nick: message.nick,
      username: message.username,
      realname: message.realname,
      sasl: message.sasl,
      caps,
      tlsOptions,
      tlsCa: config.tlsCa,
      onRaw: receiveRaw
        ? (line) => sendEnvelope('irc_raw', { line }, { connId: message.connId })
        : null,
      onEvent: (event) => sendEnvelope('irc_event', event, { connId: message.connId }),
      onConnected: (info) => sendEnvelope('connected', info, { connId: message.connId }),
      onDisconnected: (info) => sendEnvelope('disconnected', info, { connId: message.connId }),
      onError: (error) => sendError(error.code, error.message, { connId: message.connId }),
    });

    connections.set(message.connId, connection);
    connection.connect();
  };

  const handleDisconnect = (message) => {
    const connection = connections.get(message.connId);
    if (!connection) {
      sendError('conn_missing', 'Unknown connId', { connId: message.connId });
      return;
    }

    connection.close(message.reason);
    connections.delete(message.connId);
  };

  const handleIrcSend = (message) => {
    const connection = connections.get(message.connId);
    if (!connection) {
      sendError('conn_missing', 'Unknown connId', { connId: message.connId, requestId: message.requestId });
      return;
    }

    if (typeof message.line !== 'string') {
      sendError('invalid_line', 'IRC line must be a string', {
        connId: message.connId,
        requestId: message.requestId,
      });
      return;
    }

    connection.sendLine(message.line);
  };

  const handlePing = (message) => {
    sendEnvelope('pong', { nonce: message.nonce || null });
  };

  const handleMessage = (raw) => {
    if (closed) {
      return;
    }

    let message = raw;

    if (typeof raw === 'string') {
      if (raw.length > MAX_MESSAGE_SIZE) {
        sendError('message_too_large', 'Message too large');
        return;
      }

      try {
        message = JSON.parse(raw);
      } catch (error) {
        sendError('invalid_json', 'Invalid JSON');
        return;
      }
    }

    if (!limiter.allow()) {
      sendError('rate_limited', 'Too many commands');
      close('rate_limited');
      return;
    }

    const validation = validateClientMessage(message);
    if (!validation.ok) {
      sendError('invalid_message', 'Invalid message');
      return;
    }

    switch (message.type) {
      case 'connect':
        handleConnect(message);
        break;
      case 'disconnect':
        handleDisconnect(message);
        break;
      case 'irc_send':
        handleIrcSend(message);
        break;
      case 'ping':
        handlePing(message);
        break;
      default:
        sendError('unknown_type', 'Unknown message type');
    }
  };

  const close = (reason) => {
    if (closed) {
      return;
    }

    closed = true;

    for (const connection of connections.values()) {
      connection.close('client_closed');
    }

    connections.clear();

    if (onClose) {
      onClose({ reason: reason || 'closed' });
    }
  };

  const start = () => {
    sendEnvelope('hello', {
      version: '1.0',
      serverTime: new Date().toISOString(),
    });
    logInfo('ipc_session_open', { ip });
  };

  return { start, handleMessage, close };
};

module.exports = {
  createSession,
};
