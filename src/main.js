const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { createGatewayManager } = require('./gateway/manager');
const { createFileLogger } = require('./logging');

let gatewayManager = null;
let isQuitting = false;
let fileLogger = null;

const ensureGatewayManager = () => {
  if (!gatewayManager) {
    gatewayManager = createGatewayManager();
  }

  return gatewayManager;
};

const initLogging = () => {
  if (fileLogger) {
    return fileLogger;
  }

  const logDir = path.join(app.getPath('userData'), 'logs');
  fileLogger = createFileLogger(logDir);
  return fileLogger;
};

const registerProcessGuards = () => {
  const logger = initLogging();

  process.on('uncaughtException', (error) => {
    logger.logError('uncaught_exception', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.logError('unhandled_rejection', reason);
  });
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

const createWindow = (rendererTarget, isDev) => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0d0f12',
    autoHideMenuBar: !isDev,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: resolvePreloadPath(),
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (rendererTarget.startsWith('http://') || rendererTarget.startsWith('https://')) {
    win.loadURL(rendererTarget);
  } else {
    win.loadFile(rendererTarget);
  }

  const allowedOrigin = (() => {
    if (rendererTarget.startsWith('http://') || rendererTarget.startsWith('https://')) {
      try {
        return new URL(rendererTarget).origin;
      } catch {
        return null;
      }
    }
    return 'file://';
  })();

  const isAllowedNavigation = (url) => {
    if (!url) {
      return false;
    }

    if (allowedOrigin === 'file://') {
      return url.startsWith('file://');
    }

    if (!allowedOrigin) {
      return false;
    }

    try {
      return new URL(url).origin === allowedOrigin;
    } catch {
      return false;
    }
  };

  const closeGatewayForContents = (reason) => {
    if (!gatewayManager) {
      return;
    }

    gatewayManager.closeAllForWebContents(win.webContents, reason);
  };

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on(
    'did-start-navigation',
    (event, url, isInPlace, isMainFrame) => {
      if (!isMainFrame || isInPlace) {
        return;
      }

      if (isAllowedNavigation(url)) {
        closeGatewayForContents('renderer_navigate');
      }
    }
  );

  win.webContents.on('will-navigate', (event, url) => {
    if (isAllowedNavigation(url)) {
      return;
    }

    event.preventDefault();

    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  });

  return win;
};

const registerIpcHandlers = () => {
  ipcMain.handle('gateway:open', (event) =>
    ensureGatewayManager().openSession(event.sender)
  );

  ipcMain.on('gateway:message', (event, sessionId, payload) => {
    ensureGatewayManager().handleMessage(sessionId, payload);
  });

  ipcMain.on('gateway:close', (event, sessionId) => {
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

const startApp = () => {
  registerProcessGuards();
  ensureGatewayManager();
  registerIpcHandlers();

  const rendererTarget = resolveRendererTarget();
  const isDev = Boolean(process.env.ELECTRON_RENDERER_URL) && !app.isPackaged;
  createWindow(rendererTarget, isDev);
};

app.whenReady().then(startApp);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const rendererTarget = resolveRendererTarget();
    const isDev = Boolean(process.env.ELECTRON_RENDERER_URL) && !app.isPackaged;
    createWindow(rendererTarget, isDev);
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
