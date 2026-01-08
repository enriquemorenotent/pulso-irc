const isPlainObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return true;
};

const validateClientMessage = (message) => {
  if (!isPlainObject(message)) {
    return { ok: false, reason: 'invalid_message' };
  }

  if (typeof message.type !== 'string' || message.type.trim() === '') {
    return { ok: false, reason: 'missing_type' };
  }

  return { ok: true };
};

module.exports = {
  validateClientMessage,
};
