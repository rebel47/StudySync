Study Timer — Minimalist

What I added
- A single static page: `index.html` with a modern minimalist timer UI.
- Shareable rooms via unique URL `?room=<id>`.
- Real-time sync methods:
  - BroadcastChannel for same-browser tabs (no config required).
  - Optional Firebase Realtime Database sync: paste your Firebase config JSON into the page and click "Save config" to enable cross-device realtime updates.

How to use
1. Open `index.html` in your browser (double-click or host on any static server).
2. Click "Create room" to generate a unique share link. The page will copy the link to the clipboard.
3. Open the link on another device or share it with a classmate. If both clients are on the same browser origin, BroadcastChannel will sync state. For cross-origin/device syncing use Firebase (see below).

Enable Firebase realtime sync (optional)
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Realtime Database and set rules to allow read/write for quick testing (be careful: these rules make your DB public):
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
3. From Project settings, copy the Web SDK (Config) object (apiKey, authDomain, databaseURL, projectId...). Paste that JSON into the "Realtime backend" textarea in the page and click "Save config".
4. Create or join a room using the link. The page will write/read the room state in `study-rooms/<roomId>`.

Notes and next steps
- The page is intentionally lightweight and client-first. For production, secure your Firebase rules and optionally add authentication and presence features.
- If you want a version that uses WebRTC or a server for low-latency presence and voice, I can scaffold a small Node/Express signaling server.

Files
- `index.html` — UI and logic (single-file app).
