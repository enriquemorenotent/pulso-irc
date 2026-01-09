# Desktop App (Electron)

## Overview
The desktop app bundles the renderer and runs the IRC engine locally inside the
Electron main process. The renderer talks to it over IPC.

## Renderer structure
- `renderer/src/irc/state/` contains IRC state factories, reducers, and event handling.
- `renderer/src/irc/state/events/` groups IRC event handlers by command type.
- `renderer/src/irc/selectors.js` collects renderer-facing derived state helpers.
- `renderer/src/app/` hosts app-level hooks and orchestration helpers.
- `renderer/src/app/useCommandPalette.js` manages command palette state and actions.
- `renderer/src/app/layout/` builds layout props for header/sidebar/panels.
- `renderer/src/components/AppLayout.jsx` renders the main application layout.
- `renderer/src/components/CommandPalette.jsx` handles the command palette overlay.
- `renderer/src/components/ConnectionsSidebar/` hosts sidebar subcomponents.
- `renderer/src/components/SettingsPanel/` splits settings sections.
- `renderer/src/components/messages/` hosts message row media helpers.
- `renderer/src/hooks/useConnections/` splits connection lifecycle/history/cleanup helpers.
- `renderer/src/hooks/useIrcCommands/` splits input history/completion/command handlers.
- `renderer/src/hooks/useAppView.js` centralizes view routing helpers.

## Gateway structure
- `src/gateway/irc/` contains IRC connection and capability helpers (connection, backoff, CAP/SASL flow).

## Main process structure
- `src/main/` contains window, IPC, and process guard helpers used by `src/main.js`.

## Prerequisites
- Node.js + npm

## Install
```bash
npm install
```

## Development
```bash
npm run dev
```
This starts the Vite dev server and launches Electron.
Refreshing the renderer window closes active IRC sessions so nicks are released.

## Build (Linux)
```bash
npm run build
```
Artifacts land in `dist/`.

## CI
GitHub Actions runs dependency audits, gateway tests, renderer lint/build, and
prepares the Electron bundle on pushes and pull requests.

## Engine defaults
- `ALLOW_ANY_IRC_HOST=true`
- `MAX_CONNECTIONS_PER_CLIENT=4`
- `MAX_COMMANDS_PER_SECOND=20`

Override with environment variables if needed.

## Logs
The Electron main process writes crash logs to `userData/logs/main.log`.
Renderer errors are forwarded to the same log file. Logs are rotated at ~2 MB.

## External links
External links opened from the UI are sent to your default browser.

## Data export/import
Use Settings → Data Transfer to export or import all local data. The backup file
includes profiles, friends, logs, and saved passwords.
