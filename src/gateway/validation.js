const MAX_IRC_LINE_LENGTH = 512;

const isPlainObject = (value) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	return true;
};

const isNonEmptyString = (value) =>
	typeof value === 'string' && value.trim() !== '';

const isOptionalString = (value) =>
	value === undefined || typeof value === 'string';

const parsePort = (value) => {
	if (typeof value === 'number') {
		return Number.isInteger(value) ? value : null;
	}

	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number.parseInt(value, 10);
		return Number.isInteger(parsed) ? parsed : null;
	}

	return null;
};

const isValidPort = (value) => {
	const parsed = parsePort(value);
	return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535;
};

const isValidCaps = (caps) => {
	if (caps === undefined) {
		return true;
	}

	if (!Array.isArray(caps)) {
		return false;
	}

	return caps.every((cap) => isNonEmptyString(cap));
};

const hasValidOptions = (options) => {
	if (options === undefined) {
		return true;
	}

	if (!isPlainObject(options)) {
		return false;
	}

	if ('receiveRaw' in options && typeof options.receiveRaw !== 'boolean') {
		return false;
	}

	return true;
};

const validateConnect = (message) => {
	if (!isNonEmptyString(message.connId)) {
		return { ok: false, reason: 'invalid_conn_id' };
	}

	if (!isNonEmptyString(message.host)) {
		return { ok: false, reason: 'invalid_host' };
	}

	if (!isValidPort(message.port)) {
		return { ok: false, reason: 'invalid_port' };
	}

	if (message.tls !== true) {
		return { ok: false, reason: 'invalid_tls' };
	}

	if (!isNonEmptyString(message.nick)) {
		return { ok: false, reason: 'invalid_nick' };
	}

	if (!isNonEmptyString(message.username)) {
		return { ok: false, reason: 'invalid_username' };
	}

	if (!isNonEmptyString(message.realname)) {
		return { ok: false, reason: 'invalid_realname' };
	}

	if (!isValidCaps(message.caps)) {
		return { ok: false, reason: 'invalid_caps' };
	}

	if (!hasValidOptions(message.options)) {
		return { ok: false, reason: 'invalid_options' };
	}

	if (
		!isOptionalString(message.clientCert) ||
		!isOptionalString(message.clientKey)
	) {
		return { ok: false, reason: 'invalid_client_cert' };
	}

	if (
		message.clientCert !== undefined &&
		!isNonEmptyString(message.clientCert)
	) {
		return { ok: false, reason: 'invalid_client_cert' };
	}

	if (
		message.clientKey !== undefined &&
		!isNonEmptyString(message.clientKey)
	) {
		return { ok: false, reason: 'invalid_client_key' };
	}

	if (message.sasl !== undefined) {
		if (!isPlainObject(message.sasl)) {
			return { ok: false, reason: 'invalid_sasl' };
		}

		if (!isNonEmptyString(message.sasl.method)) {
			return { ok: false, reason: 'invalid_sasl' };
		}

		const method = message.sasl.method;
		if (method !== 'PLAIN' && method !== 'EXTERNAL') {
			return { ok: false, reason: 'invalid_sasl' };
		}

		if (method === 'PLAIN' && typeof message.sasl.password !== 'string') {
			return { ok: false, reason: 'invalid_sasl' };
		}

		if (method === 'EXTERNAL') {
			if (
				!isNonEmptyString(message.clientCert) ||
				!isNonEmptyString(message.clientKey)
			) {
				return { ok: false, reason: 'invalid_sasl' };
			}
		}

		if (
			message.sasl.authzid !== undefined &&
			typeof message.sasl.authzid !== 'string'
		) {
			return { ok: false, reason: 'invalid_sasl' };
		}
	}

	return { ok: true };
};

const validateDisconnect = (message) => {
	if (!isNonEmptyString(message.connId)) {
		return { ok: false, reason: 'invalid_conn_id' };
	}

	if (message.reason !== undefined && typeof message.reason !== 'string') {
		return { ok: false, reason: 'invalid_reason' };
	}

	return { ok: true };
};

const validateIrcSend = (message) => {
	if (!isNonEmptyString(message.connId)) {
		return { ok: false, reason: 'invalid_conn_id' };
	}

	if (typeof message.line !== 'string') {
		return { ok: false, reason: 'invalid_line' };
	}

	if (message.line.trim() === '') {
		return { ok: false, reason: 'invalid_line' };
	}

	if (message.line.includes('\r') || message.line.includes('\n')) {
		return { ok: false, reason: 'invalid_line' };
	}

	if (message.line.length > MAX_IRC_LINE_LENGTH) {
		return { ok: false, reason: 'invalid_line' };
	}

	return { ok: true };
};

const validatePing = (message) => {
	if (message.nonce !== undefined && typeof message.nonce !== 'string') {
		return { ok: false, reason: 'invalid_nonce' };
	}

	return { ok: true };
};

const validateClientMessage = (message) => {
	if (!isPlainObject(message)) {
		return { ok: false, reason: 'invalid_message' };
	}

	if (typeof message.type !== 'string' || message.type.trim() === '') {
		return { ok: false, reason: 'missing_type' };
	}

	switch (message.type) {
		case 'connect':
			return validateConnect(message);
		case 'disconnect':
			return validateDisconnect(message);
		case 'irc_send':
			return validateIrcSend(message);
		case 'ping':
			return validatePing(message);
		default:
			return { ok: true };
	}
};

module.exports = {
	validateClientMessage,
};
