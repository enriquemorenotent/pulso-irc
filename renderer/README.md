# Pulso IRC Desktop Renderer (Frontend)

## Development (renderer only)
```bash
npm install
npm run dev
```
The dev server runs on http://localhost:4317 by default.

For a full app experience (including the embedded IRC engine), run from the repo root:
```bash
npm install
npm install --prefix renderer
npm run dev
```

## What this UI does
- Connects to the embedded IRC engine described in `docs/gateway.md`.
- Starts with a server list and connect flow, plus a separate profile management view.
- Shows messages with basic IRC formatting and a live nicklist for channels.
- Shows channel list (LIST) results in a searchable, sortable modal with quick join, refresh, and error feedback (also via server context menu).
- Shows role badges in the channel user list instead of raw prefix symbols.
- Linkifies URLs in chat and status messages.
- Channel names in messages are clickable and join/switch on click.
- Double-clicking a nick in the user list opens a DM.
- Double-clicking a sender nick in chat opens a DM; right-clicking shows the same options menu.
- Nick context menus include a WHOIS action that opens a modal with user details.
- Friends are added via user nick context menus (nicklist or sender names).
- Friend DM tabs show a colored user icon.
- Online friends are grouped under network headers in the sidebar, with a toggle to show offline friends.
- DM tabs in the sidebar have a quick close button and a right-click menu with friend/block actions.
- New messages from blocked users are hidden (existing logs remain).
- DM tabs are not restored on launch; opening a DM loads its local history.
- DM tabs dim when the nick is not seen in a channel on that connection.
- Channel and DM tabs stay visible (dimmed) when disconnected so you can read logs.
- Channel and DM tabs can clear their local logs from the right-click menu.
- Channel and DM tabs can toggle a per-tab beep on new messages from the right-click menu.
- Sends a local echo for outgoing DM messages when the server does not support echo-message.
- Applies profile and default edits only after you save them in Manage Profiles.
- Shows an engine status indicator with a manual recheck.
- Supports multiple simultaneous server connections with channels grouped by server (channels appear in the sidebar only after join is confirmed).
- Orders sidebar tabs by channels first, then DMs, with each group sorted alphabetically.
- Adds a status note when a server auto-joins you to a channel.
- Auto-retries nickname selection with suffixes if the requested nick is in use.
- Lets you configure per-profile auto-join channels.
- Shows unread message counts per channel/DM in the sidebar.
- Unread counts only include chat messages (not join/part/quit activity).
- Shows a "New messages" divider at the last read position when returning to a channel/DM.
- Switching channels or DMs focuses the message input automatically.
- Disconnect keeps the server and its tabs in the sidebar; closing removes it (both are in the server context menu; the power icon is a disconnect shortcut).
- When disconnected, chat actions like sending messages, WHOIS, and opening new DMs are disabled, and the server context menu offers reconnect.
- Up/down arrows cycle through your sent input history.
- Tab completes nicknames in the active channel and cycles matches (Shift+Tab reverses).
- DM views show a right sidebar with user notes.
- Routes user-mode/system events to *status unless they target a channel, excluding AWAY updates.
- Shows MOTD and welcome numerics in *status.
- Routes server NOTICE/PRIVMSG to *status instead of creating a DM tab.
- Routes non-channel NOTICEs to *status by default, but shows NOTICEs in a channel when the sender is only present in one channel.
- The server name opens the status view; *status is hidden from the channel list.
- Ignores IRCv3 history playback (batch/time-tagged backlog) from servers.

## Default profiles
Default profiles include 30+ popular IRC networks (TLS on 6697). The full list
lives in `renderer/src/irc/constants.js`.

## New profiles
- New profiles start blank and are configured in Manage Profiles.

## Global defaults
- Nick/username/realname and port are stored as global defaults.
- Profile settings override the defaults only when set.

## Persistence and Secrets
- Non-sensitive defaults and connection settings are stored locally in `localStorage`.
- Last 300 messages per channel/DM are stored locally in `localStorage`.
- DM notes are stored locally in `localStorage`.
- Per-tab beep preferences are stored locally in `localStorage`.
- SASL passwords are stored per profile in plaintext in `localStorage`.
- Client certs and client keys are kept in memory only and are not persisted.

## Commands
Supported slash commands:
- `/join #channel`
- `/part #channel`
- `/msg nick message`
- `/query nick [message]`
- `/me action`
- `/nick newNick`
- `/topic #channel topic`
- `/mode #channel +m`
- `/whois nick`
- `/who #channel`
- `/list`
- `/raw IRC_LINE`

You can also right-click a channel in the sidebar and choose "Part channel."
Using `/msg` or `/query` opens a DM tab for the target nick.

## Styling
Tailwind CSS is used for layout. `src/index.css` sets the base fonts and
background for the client.
Icons use Lucide (`lucide-react`).

## Message rendering
Links to images in chat messages render inline previews (ESC closes the image modal), and gifv links render as looping video previews. Inline previews can be disabled in Settings.
Join/part/quit events render in channel timelines and are visually de-emphasized with subtle status markers.
Your own messages use a subtle left border and light background tint for quick scanning.
Channel role mode changes (voice/op/admin/owner/half-op) render as badge system lines and update the nicklist badges.
Nick changes render as status-style lines (matching join/part/quit) in affected channels and in *status, and DM tabs follow the new nick when possible.
