const base64Encode = (value) => Buffer.from(value, 'utf8').toString('base64');

const buildSaslResponse = ({ method, username, password, authzid }) => {
  if (method === 'PLAIN') {
    const user = authzid || username || '';
    const payload = `\u0000${user}\u0000${password || ''}`;
    return base64Encode(payload);
  }

  if (method === 'EXTERNAL') {
    const payload = authzid || '';
    return base64Encode(payload);
  }

  return '';
};

const parseCapList = (raw) => {
  if (!raw) {
    return [];
  }

  return raw
    .split(' ')
    .map((cap) => cap.trim())
    .filter(Boolean);
};

const createCapabilityHandler = ({
  caps,
  sasl,
  username,
  sendLine,
  onCapEnd,
  onError,
}) => {
  let capRequested = new Set(caps || []);
  let capEnabled = new Set();
  let capOffered = new Set();
  let capLsComplete = false;
  let saslState = 'idle';
  let capFinished = false;

  const emitError = (code, message) => {
    if (onError) {
      onError(code, message);
    }
  };

  const reset = () => {
    capRequested = new Set(caps || []);
    capEnabled = new Set();
    capOffered = new Set();
    capLsComplete = false;
    saslState = 'idle';
    capFinished = false;
  };

  const finishCap = () => {
    if (capFinished) {
      return;
    }
    capFinished = true;
    if (onCapEnd) {
      onCapEnd(Array.from(capEnabled));
    }
  };

  const startSasl = () => {
    if (!sasl || !sasl.method) {
      finishCap();
      return;
    }

    saslState = 'requested';
    sendLine(`AUTHENTICATE ${sasl.method}`);
  };

  const handleAuthenticate = (parsed) => {
    if (saslState !== 'requested') {
      return;
    }

    const payload = parsed.params[0];
    if (payload !== '+') {
      emitError('sasl_unexpected', 'Unexpected SASL payload');
      return;
    }

    const response = buildSaslResponse({
      method: sasl.method,
      username,
      password: sasl.password,
      authzid: sasl.authzid,
    });

    if (!response) {
      emitError('sasl_unsupported', 'Unsupported SASL method');
      return;
    }

    saslState = 'in_progress';
    sendLine(`AUTHENTICATE ${response}`);
  };

  const handleCapLs = (parsed) => {
    const capListRaw = parsed.params[parsed.params.length - 1] || '';
    const hasMore = parsed.params[2] === '*';
    const offered = parseCapList(capListRaw);

    offered.forEach((cap) => capOffered.add(cap));

    if (hasMore) {
      return;
    }

    capLsComplete = true;
    const requested = Array.from(capOffered).filter((cap) => capRequested.has(cap));

    if (requested.length > 0) {
      sendLine(`CAP REQ :${requested.join(' ')}`);
    } else {
      finishCap();
    }
  };

  const handleCap = (parsed) => {
    const subCommand = parsed.params[1];

    if (subCommand === 'LS') {
      handleCapLs(parsed);
      return;
    }

    if (subCommand === 'ACK') {
      const capListRaw = parsed.params.slice(2).join(' ');
      const enabled = parseCapList(capListRaw);
      enabled.forEach((cap) => capEnabled.add(cap));

      if (capEnabled.has('sasl')) {
        startSasl();
        return;
      }

      finishCap();
      return;
    }

    if (subCommand === 'NAK') {
      emitError('cap_nak', 'Requested capabilities were rejected');
      if (capLsComplete) {
        finishCap();
      }
    }
  };

  const handleNumeric = (command) => {
    if (command === '903') {
      saslState = 'done';
      finishCap();
      return;
    }

    if (['904', '905', '906', '907'].includes(command)) {
      saslState = 'failed';
      emitError('sasl_failed', 'SASL authentication failed');
      finishCap();
    }
  };

  const getEnabledCaps = () => Array.from(capEnabled);

  return {
    reset,
    handleCap,
    handleAuthenticate,
    handleNumeric,
    getEnabledCaps,
  };
};

module.exports = {
  createCapabilityHandler,
};
