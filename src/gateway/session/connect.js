const { createIrcConnection } = require('../irc/connection');
const { isIrcHostAllowed } = require('../config');
const { logInfo, logWarn } = require('../logger');

const createConnectHandler = ({ connections, config, sendEnvelope, sendError }) => {
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
          sendError('invalid_sasl', 'clientCert and clientKey are required for EXTERNAL', {
            connId: message.connId,
          });
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

  return handleConnect;
};

module.exports = {
  createConnectHandler,
};
