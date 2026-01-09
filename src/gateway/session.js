const { randomUUID } = require('crypto');
const { createRateLimiter } = require('./rate_limit');
const { validateClientMessage } = require('./validation');
const { logInfo } = require('./logger');
const { createSessionHandlers } = require('./session/handlers');

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

  const { handleConnect, handleDisconnect, handleIrcSend, handlePing } =
    createSessionHandlers({
      connections,
      config,
      sendEnvelope,
      sendError,
    });

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
