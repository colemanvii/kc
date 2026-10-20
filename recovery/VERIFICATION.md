# Verification — 20 October 2026

User flow: open the minimal browser preview, load the recovered seated images,
play their sequence, pause, step poses, and adjust the hold duration.

- All 32 recovered character-development and film files matched their original local files byte-for-byte.
- All six bitmap source hashes matched the recorded provenance prefixes/suffixes.
- The balloon reference copy matched the repository master byte-for-byte.
- `git bundle verify` confirmed a complete local branch-history backup with nine refs.
- The browser loaded the desktop preview at `http://127.0.0.1:5217/bitmap-preview/`.
- The isolated single-file preview loaded at `http://172.20.10.3:5218/` on this Mac.
- Playback advanced from neutral to singing; Pause stopped playback; Next pose wrapped singing to neutral.
- The hold selector successfully changed from 1.5 to 0.9 seconds.
- Browser console reported no warnings or errors during the isolated preview check.
- `preview-verified.png` records the verified browser view.

The phone package serves only `bitmap-preview/share/index.html`, with three
embedded WebP assets and no external requests. The initial attempt to share
the full repository was rejected by automatic review. The isolated package
was subsequently approved and started successfully.

Actual iPhone Safari has not been tested. The network link requires this Mac
to remain awake with the server running, and the phone to reach the Mac on
the same network. The address may change when the network changes.

This is an expression timing reference only. It does not demonstrate body
acting, a walk, a sit, strumming, lip sync, or synchronization to a recording.
