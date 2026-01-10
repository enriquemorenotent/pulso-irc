# Pulso IRC Desktop Client - Product Spec (v1)

## Goal
Build a modern, full-featured desktop IRC client with an embedded IRC engine,
supporting core IRCv3 capabilities and local-only persistence.

## Target Users
- Single user (the project owner).

## Platforms
- Desktop app (Electron) for Linux only.

## Architecture
- Renderer UI communicates with an embedded IRC engine over IPC.
- The engine connects to IRC servers over TLS.
- The engine keeps in-memory session state for the lifetime of the app and stores no messages or credentials.
- Engine implementation details: `docs/gateway.md`.

## Supported Servers
- Any standard IRC server that supports TLS.
- Plaintext IRC connections are not supported.

## Authentication
- SASL is optional.
- Supported methods: PLAIN and EXTERNAL.

## Persistence
- No disk storage in the engine.
- Local-only persistence in the renderer (e.g., IndexedDB/localStorage).

## Language
- English only. No i18n in v1.

## Mandatory IRCv3 Capabilities
- cap-notify
- echo-message
- extended-join
- away-notify
- account-notify
- chghost
- monitor
- multi-prefix
- invite-notify
- sasl

## Deferred IRCv3 Capabilities (post-v1)
- message-tags
- labeled-response

## Security Constraints (Non-negotiable)
- IRC connections are TLS-only.
- No engine disk storage of messages or credentials.
- Local-only usage: no remote gateway service.
- IRC passwords stored locally only if user opts in; stored in plaintext in
  local storage; otherwise in-memory only.
- Engine logs exclude message contents and credentials; operational metrics only.
- Optional IRC host allowlist.
- Rate-limit connections and commands per client.
- UI must escape/sanitize all message content to prevent XSS.

## Non-goals (v1)
- DCC file transfer
- Voice/video
- Server-side logging/history
- Multi-tenant hosting/admin UI
- Plugin system
- Theme marketplace

## Explicitly rejected (do not implement)
- Server-provided history playback (IRCv3 server-time/batch backlogs).
- Highlights/mentions rules.

## Feature Matrix (v1)
Legend: R = required, O = optional, N = not in v1.

- F1 Multi-network profiles: R
- F1a Simultaneous connections to multiple servers: R
- F2 Auto-reconnect with backoff: R
- F3 CAP negotiation (general support): R
- F4 Slash commands (/join, /part, /msg, /me, /topic, /nick, /mode, /whois, /who, /list): R
- F5 Nicklist with user prefixes/modes: R
- F6 Channel list (LIST) UI: O
- F7 WHO/WHOIS UI: O
- F8 CTCP ACTION/PING/VERSION: O
- F9 mIRC formatting (bold/italic/underline/colors; messages only, topics stripped to plain text; colors mapped to theme-aware Tailwind palette utilities): R
- F10 Scrollback + full-text search: O
- F11 Highlights/mentions rules: N
- F12 Desktop notifications + sound: O
- F13 Ignore/mute rules: O
- F14 Local export of logs (download): O
- F15 Per-channel settings (notify, mute, highlight): O
- F16 Multi-tab or split-view UI for channels/DMs: O
- F17 Auto-join list configurable per profile (profile editor + channel context menu + sidebar indicator): R
- F18 Show per-connection nick in sidebar and chat header: R
- F19 Surface IRC error numerics in status tab: R
- F20 Distinct icons for channels vs DMs in sidebar: R
- F21 Render IRC formatting in status/system messages: R
- F22 Preserve IRC whitespace in message rendering: R
- F23 Use monospace for system/status lines to preserve alignment: R
- F24 Unread counts per channel/DM in sidebar: R
- F25 Part channel via sidebar context menu: R
- F26 Remove channel from list on self-PART: R
- F27 Smart auto-scroll with “new messages” indicator: R
- F28 Inline image previews for image links: R
