# IPC <-> IRC Engine Schema (Draft v1)

All messages are JSON objects. Engine timestamps are RFC3339 UTC strings.

## Envelope (engine -> renderer)
```json
{
  "type": "string",
  "id": "uuid",
  "time": "2026-01-04T12:34:56Z",
  "connId": "string (required for network-scoped messages)",
  "requestId": "string (optional, echoes client request)"
}
```

## Envelope (renderer -> engine)
```json
{
  "type": "string",
  "connId": "string (required for network-scoped messages)",
  "requestId": "string (optional)"
}
```

## Handshake
- `hello` (engine -> renderer): `{ "version": "1.0", "serverTime": "RFC3339" }`

The renderer can send `connect` immediately after `hello`.

## Connection Control
### connect (renderer -> engine)
```json
{
  "connId": "string",
  "host": "string",
  "port": 6697,
  "tls": true,
  "nick": "string",
  "username": "string",
  "realname": "string",
  "sasl": {
    "method": "PLAIN|EXTERNAL",
    "password": "string (PLAIN only)",
    "authzid": "string (optional)"
  },
  "clientCert": "base64 (EXTERNAL only)",
  "clientKey": "base64 (EXTERNAL only)",
  "caps": [
    "cap-notify",
    "echo-message",
    "extended-join",
    "away-notify",
    "account-notify",
    "chghost",
    "monitor",
    "multi-prefix",
    "invite-notify",
    "sasl"
  ],
  "options": { "receiveRaw": true }
}
```

- `connected` (engine -> renderer): `{ "server": "string", "capEnabled": ["..."] }`
- `disconnect` (renderer -> engine): `{ "reason": "string" }`
- `disconnected` (engine -> renderer): `{ "reason": "string", "reconnectInMs": 0 }`

## Renderer -> Engine Commands
- `irc_send`: `{ "line": "RAW IRC LINE", "requestId": "string" }`

## Engine -> Renderer Events
- `irc_raw`: `{ "line": "RAW IRC LINE" }`
- `irc_event` (normalized parsed event):
```json
{
  "command": "PRIVMSG|NOTICE|JOIN|PART|QUIT|NICK|TOPIC|MODE|KICK|INVITE|ACCOUNT|AWAY|CHGHOST|CAP|AUTHENTICATE|REPLY",
  "prefix": { "nick": "string", "user": "string", "host": "string", "server": "string" },
  "params": ["..."],
  "tags": { "key": "value" },
  "target": "#channel|nick",
  "text": "string",
  "serverTime": "RFC3339 (server tag when available, otherwise gateway time)",
  "batchId": "string (optional)",
  "labeledResponse": "string (optional)"
}
```

## Errors + Health
- `error`: `{ "code": "string", "message": "string", "fatal": false }`
- `ping` / `pong`: `{ "nonce": "string" }`
