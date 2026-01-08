const { randomUUID } = require('crypto');
const { createSession } = require('./session');
const { loadConfig } = require('./config');
const { logInfo, logWarn } = require('./logger');

const createGatewayManager = () => {
  const config = loadConfig();
  const sessions = new Map();
  const trackedContents = new Set();

  const sendToRenderer = (webContents, sessionId, message) => {
    if (webContents.isDestroyed()) {
      return;
    }

    webContents.send('gateway:message', sessionId, message);
  };

  const registerWebContents = (webContents) => {
    if (trackedContents.has(webContents)) {
      return;
    }

    trackedContents.add(webContents);

    webContents.once('destroyed', () => {
      closeAllForWebContents(webContents, 'renderer_destroyed');
      trackedContents.delete(webContents);
    });
  };

  const openSession = (webContents) => {
    registerWebContents(webContents);

    const sessionId = randomUUID();

    const session = createSession({
      send: (message) => sendToRenderer(webContents, sessionId, message),
      onClose: (info) => {
        if (!webContents.isDestroyed()) {
          webContents.send('gateway:close', sessionId, {
            reason: info?.reason || 'closed',
          });
        }
        sessions.delete(sessionId);
      },
      config,
      ip: 'local',
    });

    sessions.set(sessionId, { session, webContents });
    session.start();
    logInfo('ipc_session_created', { sessionId });

    return sessionId;
  };

  const handleMessage = (sessionId, payload) => {
    const entry = sessions.get(sessionId);
    if (!entry) {
      logWarn('ipc_session_missing', { sessionId });
      return;
    }

    entry.session.handleMessage(payload);
  };

  const closeSession = (sessionId, reason) => {
    const entry = sessions.get(sessionId);
    if (!entry) {
      return;
    }

    entry.session.close(reason || 'client_closed');
    sessions.delete(sessionId);
  };

  const closeAllForWebContents = (webContents, reason) => {
    for (const [sessionId, entry] of sessions.entries()) {
      if (entry.webContents === webContents) {
        entry.session.close(reason || 'renderer_closed');
        sessions.delete(sessionId);
      }
    }
  };

  const closeAll = (reason) => {
    for (const [sessionId, entry] of sessions.entries()) {
      entry.session.close(reason || 'app_closed');
      sessions.delete(sessionId);
    }
  };

  return {
    openSession,
    handleMessage,
    closeSession,
    closeAllForWebContents,
    closeAll,
  };
};

module.exports = {
  createGatewayManager,
};
