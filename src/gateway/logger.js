const REDACT_KEYS = new Set([
  'token',
  'password',
  'line',
  'clientKey',
  'clientCert',
  'sasl',
]);

const sanitizeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') {
    return {};
  }

  const clean = {};

  for (const [key, value] of Object.entries(meta)) {
    if (REDACT_KEYS.has(key)) {
      clean[key] = '[redacted]';
      continue;
    }

    clean[key] = value;
  }

  return clean;
};

const log = (level, event, meta) => {
  const payload = {
    level,
    event,
    time: new Date().toISOString(),
    meta: sanitizeMeta(meta),
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
};

const logInfo = (event, meta) => log('info', event, meta);
const logWarn = (event, meta) => log('warn', event, meta);
const logError = (event, meta) => log('error', event, meta);

module.exports = {
  logInfo,
  logWarn,
  logError,
};
