const { contextBridge, ipcRenderer } = require('electron');

const messageListeners = new Set();
const closeListeners = new Set();

ipcRenderer.on('gateway:message', (event, sessionId, message) => {
  messageListeners.forEach((listener) => listener(sessionId, message));
});

ipcRenderer.on('gateway:close', (event, sessionId, info) => {
  closeListeners.forEach((listener) => listener(sessionId, info));
});

const open = () => ipcRenderer.invoke('gateway:open');
const send = (sessionId, payload) => {
  ipcRenderer.send('gateway:message', sessionId, payload);
};
const close = (sessionId) => {
  ipcRenderer.send('gateway:close', sessionId);
};
const ping = () => ipcRenderer.invoke('gateway:ping');
const logError = (payload) => {
  ipcRenderer.send('renderer:log', payload);
};

const onMessage = (listener) => {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
};

const onClose = (listener) => {
  closeListeners.add(listener);
  return () => closeListeners.delete(listener);
};

contextBridge.exposeInMainWorld('pulsoGateway', {
  open,
  send,
  close,
  ping,
  onMessage,
  onClose,
});

contextBridge.exposeInMainWorld('pulsoApp', {
  logError,
});
