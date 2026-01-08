const READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

const getGatewayApi = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.pulsoGateway || null;
};

const createGatewaySocket = () => {
  const api = getGatewayApi();
  const listeners = {
    open: new Set(),
    message: new Set(),
    close: new Set(),
    error: new Set(),
  };
  let readyState = READY_STATE.CONNECTING;
  let sessionId = null;
  let removeMessageListener = null;
  let removeCloseListener = null;
  const pendingMessages = [];
  const pendingEvents = [];

  const emit = (type, event) => {
    if (type === 'message' && listeners.message.size === 0) {
      pendingEvents.push(event);
      return;
    }

    listeners[type].forEach((listener) => listener(event));
  };

  const cleanup = () => {
    if (removeMessageListener) {
      removeMessageListener();
      removeMessageListener = null;
    }
    if (removeCloseListener) {
      removeCloseListener();
      removeCloseListener = null;
    }
  };

  const handleIncoming = (incomingSessionId, message) => {
    if (!sessionId) {
      if (incomingSessionId) {
        pendingMessages.push({ sessionId: incomingSessionId, message });
      }
      return;
    }

    if (incomingSessionId !== sessionId) {
      return;
    }

    emit('message', { data: JSON.stringify(message) });
  };

  const handleClose = (incomingSessionId, info) => {
    if (!sessionId || incomingSessionId !== sessionId) {
      return;
    }

    cleanup();
    readyState = READY_STATE.CLOSED;
    emit('close', {
      code: 1000,
      reason: info?.reason || 'closed',
    });
  };

  const openSession = async () => {
    if (!api) {
      readyState = READY_STATE.CLOSED;
      emit('error', { message: 'Desktop gateway not available.' });
      emit('close', { code: 1006, reason: 'gateway_unavailable' });
      return;
    }

    try {
      if (!removeMessageListener) {
        removeMessageListener = api.onMessage(handleIncoming);
      }
      if (!removeCloseListener) {
        removeCloseListener = api.onClose(handleClose);
      }

      sessionId = await api.open();
      readyState = READY_STATE.OPEN;
      emit('open', {});

      if (pendingMessages.length) {
        const pendingForSession = pendingMessages.filter(
          (entry) => entry.sessionId === sessionId
        );
        pendingMessages.length = 0;
        pendingForSession.forEach((entry) => {
          emit('message', { data: JSON.stringify(entry.message) });
        });
      }
    } catch {
      cleanup();
      readyState = READY_STATE.CLOSED;
      emit('error', { message: 'Failed to open desktop gateway.' });
      emit('close', { code: 1006, reason: 'gateway_open_failed' });
    }
  };

  openSession();

  const addEventListener = (type, listener) => {
    if (!listeners[type]) {
      return;
    }

    listeners[type].add(listener);

    if (type === 'message' && pendingEvents.length) {
      pendingEvents.splice(0).forEach((event) => listener(event));
    }
  };

  const removeEventListener = (type, listener) => {
    if (!listeners[type]) {
      return;
    }

    listeners[type].delete(listener);
  };

  const send = (payload) => {
    if (!api || readyState !== READY_STATE.OPEN || !sessionId) {
      emit('error', { message: 'Gateway is not open.' });
      return;
    }

    api.send(sessionId, payload);
  };

  const close = () => {
    if (readyState === READY_STATE.CLOSED || readyState === READY_STATE.CLOSING) {
      return;
    }

    readyState = READY_STATE.CLOSING;

    if (api && sessionId) {
      api.close(sessionId);
    }

    cleanup();
    readyState = READY_STATE.CLOSED;
    emit('close', { code: 1000, reason: 'client_closed' });
  };

  const socket = {
    addEventListener,
    removeEventListener,
    send,
    close,
  };

  Object.defineProperty(socket, 'readyState', {
    get: () => readyState,
  });

  return socket;
};

const isGatewayAvailable = async () => {
  const api = getGatewayApi();
  if (!api) {
    return false;
  }

  try {
    await api.ping();
    return true;
  } catch {
    return false;
  }
};

export { createGatewaySocket, isGatewayAvailable, READY_STATE };
