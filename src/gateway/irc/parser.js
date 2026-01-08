const decodeTagValue = (value) => {
  if (value === undefined) {
    return '';
  }

  return value
    .replace(/\\:/g, ';')
    .replace(/\\s/g, ' ')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\');
};

const parseTags = (raw) => {
  const tags = {};

  if (!raw) {
    return tags;
  }

  const parts = raw.split(';');

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!key) {
      continue;
    }

    tags[key] = value === undefined ? true : decodeTagValue(value);
  }

  return tags;
};

const parsePrefix = (raw) => {
  if (!raw) {
    return null;
  }

  const prefix = { nick: null, user: null, host: null, server: null };

  if (!raw.includes('!') && !raw.includes('@')) {
    prefix.server = raw;
    return prefix;
  }

  const [nickAndUser, host] = raw.split('@');
  const [nick, user] = nickAndUser.split('!');

  prefix.nick = nick || null;
  prefix.user = user || null;
  prefix.host = host || null;

  return prefix;
};

const parseLine = (line) => {
  let rest = line;
  let tags = {};
  let prefix = null;

  if (rest.startsWith('@')) {
    const tagEnd = rest.indexOf(' ');
    const tagSection = tagEnd === -1 ? rest.slice(1) : rest.slice(1, tagEnd);
    tags = parseTags(tagSection);
    rest = tagEnd === -1 ? '' : rest.slice(tagEnd + 1);
  }

  if (rest.startsWith(':')) {
    const prefixEnd = rest.indexOf(' ');
    const prefixSection = prefixEnd === -1 ? rest.slice(1) : rest.slice(1, prefixEnd);
    prefix = parsePrefix(prefixSection);
    rest = prefixEnd === -1 ? '' : rest.slice(prefixEnd + 1);
  }

  const params = [];
  let command = '';

  if (rest.length > 0) {
    const trailingIndex = rest.indexOf(' :');
    let beforeTrailing = rest;
    let trailing = null;

    if (trailingIndex !== -1) {
      beforeTrailing = rest.slice(0, trailingIndex);
      trailing = rest.slice(trailingIndex + 2);
    }

    const parts = beforeTrailing.split(' ').filter(Boolean);
    command = parts.shift() || '';
    params.push(...parts);

    if (trailing !== null) {
      params.push(trailing);
    }
  }

  return {
    tags,
    prefix,
    command,
    params,
  };
};

const normalizeEvent = (parsed) => {
  const { tags, prefix, command, params } = parsed;
  const target = params[0] || null;
  const text = params.length > 1 ? params[params.length - 1] : null;
  const serverTime = typeof tags.time === 'string' ? tags.time : new Date().toISOString();

  return {
    command,
    prefix: prefix || { nick: null, user: null, host: null, server: null },
    params,
    tags,
    target,
    text,
    serverTime,
    batchId: tags.batch || null,
    labeledResponse: tags.label || null,
  };
};

module.exports = {
  parseLine,
  normalizeEvent,
};
