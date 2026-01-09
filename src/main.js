const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { createGatewayManager } = require('./gateway/manager');
const { createFileLogger } = require('./logging');
const { createWindow } = require('./main/window');
const { registerIpcHandlers } = require('./main/ipc');
const { registerProcessGuards } = require('./main/processGuards');

let gatewayManager = null;
let isQuitting = false;
let fileLogger = null;

const ensureGatewayManager = () => {
  if (!gatewayManager) {
    gatewayManager = createGatewayManager();
  }

  return gatewayManager;
};

const getGatewayManager = () => gatewayManager;

const initLogging = () => {
  if (fileLogger) {
    return fileLogger;
  }

  const logDir = path.join(app.getPath('userData'), 'logs');
  fileLogger = createFileLogger(logDir);
  return fileLogger;
};

const resolvePreloadPath = () => path.join(__dirname, 'preload.js');

const resolveRendererTarget = () => {
  const devServer = process.env.ELECTRON_RENDERER_URL;
  if (devServer) {
    return devServer;
  }

  if (app.isPackaged) {
    return path.join(__dirname, 'renderer', 'index.html');
  }

  return path.join(__dirname, '..', 'renderer', 'dist', 'index.html');
};

const startApp = () => {
  registerProcessGuards({ initLogging });
  ensureGatewayManager();
  registerIpcHandlers({
    ipcMain,
    ensureGatewayManager,
    getGatewayManager,
    initLogging,
  });

  const rendererTarget = resolveRendererTarget();
  const isDev = Boolean(process.env.ELECTRON_RENDERER_URL) && !app.isPackaged;
  createWindow({
    BrowserWindow,
    shell,
    rendererTarget,
    isDev,
    preloadPath: resolvePreloadPath(),
    getGatewayManager,
  });
};

app.whenReady().then(startApp);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const rendererTarget = resolveRendererTarget();
    const isDev = Boolean(process.env.ELECTRON_RENDERER_URL) && !app.isPackaged;
    createWindow({
      BrowserWindow,
      shell,
      rendererTarget,
      isDev,
      preloadPath: resolvePreloadPath(),
      getGatewayManager,
    });
  }
});

app.on('before-quit', (event) => {
  if (isQuitting) {
    return;
  }

  isQuitting = true;

  if (!gatewayManager) {
    return;
  }

  event.preventDefault();
  gatewayManager.closeAll('app_quit');
  app.quit();
});

app.on('window-all-closed', () => {
  if (gatewayManager) {
    gatewayManager.closeAll('all_windows_closed');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
