const { createConnectHandler } = require('./connect');

const createSessionHandlers = ({ connections, config, sendEnvelope, sendError }) => {
  const handleConnect = createConnectHandler({
    connections,
    config,
    sendEnvelope,
    sendError,
  });

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
      sendError('conn_missing', 'Unknown connId', {
        connId: message.connId,
        requestId: message.requestId,
      });
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

  return {
    handleConnect,
    handleDisconnect,
    handleIrcSend,
    handlePing,
  };
};

module.exports = {
  createSessionHandlers,
};
