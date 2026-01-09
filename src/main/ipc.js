const registerIpcHandlers = ({
  ipcMain,
  ensureGatewayManager,
  getGatewayManager,
  initLogging,
}) => {
  ipcMain.handle('gateway:open', (event) =>
    ensureGatewayManager().openSession(event.sender)
  );

  ipcMain.on('gateway:message', (event, sessionId, payload) => {
    ensureGatewayManager().handleMessage(sessionId, payload);
  });

  ipcMain.on('gateway:close', (event, sessionId) => {
    const gatewayManager = getGatewayManager();
    if (!gatewayManager) {
      return;
    }

    gatewayManager.closeSession(sessionId, 'client_closed');
  });

  ipcMain.handle('gateway:ping', () => true);

  ipcMain.on('renderer:log', (event, payload) => {
    const logger = initLogging();
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const eventName =
      typeof payload.event === 'string' && payload.event.trim()
        ? payload.event
        : 'renderer_error';
    logger.log('error', eventName, {
      source: 'renderer',
      message: payload.message,
      stack: payload.stack,
      meta: payload.meta,
    });
  });
};

module.exports = { registerIpcHandlers };
