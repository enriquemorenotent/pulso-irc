const createWindow = ({
  BrowserWindow,
  shell,
  rendererTarget,
  isDev,
  preloadPath,
  getGatewayManager,
}) => {
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
      preload: preloadPath,
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
    const gatewayManager = getGatewayManager();
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

module.exports = { createWindow };
