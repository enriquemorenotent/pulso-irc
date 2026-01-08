# Embedded Gateway (IPC <-> IRC)

## Overview
The gateway runs inside the Electron main process. The renderer talks to it over
IPC using the same JSON message schema. It connects to IRC servers over TLS and
keeps in-memory session state for the lifetime of the app.

## Run
There is no separate backend process. Use the Electron app:
```bash
npm run dev
```

## Environment
- `ALLOWED_IRC_HOSTS`: comma-separated list of allowed IRC hosts
- `ALLOW_ANY_IRC_HOST`: set to `true` to bypass IRC host allowlist (default when no allowlist is set)
- `MAX_CONNECTIONS_PER_CLIENT` (or `MAX_CONNECTIONS_PER_SOCKET`): per-client connection limit (default: 4)
- `MAX_COMMANDS_PER_SECOND`: per-client command limit (default: 20)
- `IRC_TLS_CA_PATH`: optional path to a PEM CA bundle for TLS verification

## Notes
- TLS is required; plaintext IRC is rejected.
- SASL methods supported: PLAIN, EXTERNAL.
- For SASL EXTERNAL, provide `clientCert` and `clientKey` as base64 in the
  `connect` message. These are not stored.
- Logs never include message contents or credentials.

## Session lifetime
- Sessions are per renderer window and reset when the window reloads or closes.
