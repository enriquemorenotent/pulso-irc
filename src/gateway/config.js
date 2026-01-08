const fs = require('fs');

const parseList = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseIntSafe = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const loadTlsCa = () => {
  const caPath = process.env.IRC_TLS_CA_PATH;
  if (!caPath) {
    return null;
  }

  try {
    return fs.readFileSync(caPath);
  } catch {
    return null;
  }
};

const loadConfig = () => {
  const allowedIrcHosts = parseList(process.env.ALLOWED_IRC_HOSTS);
  const allowAnyIrcHost =
    process.env.ALLOW_ANY_IRC_HOST === 'true' || allowedIrcHosts.length === 0;

  return {
    allowedIrcHosts,
    allowAnyIrcHost,
    tlsCa: loadTlsCa(),
    maxConnectionsPerClient: parseIntSafe(
      process.env.MAX_CONNECTIONS_PER_CLIENT ||
        process.env.MAX_CONNECTIONS_PER_SOCKET,
      4
    ),
    maxCommandsPerSecond: parseIntSafe(
      process.env.MAX_COMMANDS_PER_SECOND,
      20
    ),
  };
};

const listAllowsAny = (list) => list.includes('*');

const isIrcHostAllowed = (config, host) => {
  if (config.allowAnyIrcHost || listAllowsAny(config.allowedIrcHosts)) {
    return true;
  }

  if (!host) {
    return false;
  }

  return config.allowedIrcHosts.includes(host);
};

module.exports = {
  loadConfig,
  isIrcHostAllowed,
};
