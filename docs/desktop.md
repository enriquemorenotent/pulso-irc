# Desktop App (Electron)

## Overview
The desktop app bundles the renderer and runs the IRC engine locally inside the
Electron main process. The renderer talks to it over IPC.

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
