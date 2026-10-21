# Seated beat 001 — player implementation note

Plain static page: `index.html`, `player.css`, `player.js`. No dependencies.

## How it works

- Reads `../timing.json` and `../candidates/manifest.json`. Asset paths in
  timing.json are resolved from the workspace root (`../../../`).
- All four images load and decode before any control is enabled. If any fail,
  the stage shows which file failed and playback stays disabled; no broken
  image is inserted.
- The four whole 1254×1254 images are stacked at the same square frame. The
  current drawing has `z-index: 1`; all are fully opaque (min alpha 255), so
  this is a hard cut. Nothing is cropped, scaled per-image, transformed,
  blended or eased. Every image stays painted, so a cut never shows a blank
  frame while a hidden image is re-rasterised.
- Clock: frame = anchorFrame + floor(elapsed × 24 × speed). Changing speed,
  scrubbing and stepping re-anchor the clock. Elapsed time is clamped at 0,
  because a rAF timestamp can predate the anchor taken on Play.
- Starts paused on frame 0 and never autoplays, which also covers reduced-motion
  preferences. Pauses on `visibilitychange` when hidden. Stops on frame 95;
  Loop (off by default) restarts at frame 0. Play on the final frame restarts.
- Prev/Next jump to beat starts (Prev from mid-beat goes to that beat's start).
  Arrow keys step single frames; Space toggles play.
- The "Candidate drawing — awaiting approval" badge shows whenever the current
  asset path appears in `candidates/manifest.json`.
- The stage shrinks on short screens (`100svh - 350px`, min 260px) so the
  controls stay in view.

## Run

Serve the workspace root on localhost only, then open the player:

    python3 -m http.server 8731 --bind 127.0.0.1 --directory /Users/colecalfee/Documents/ChatGPT/Kash/kc
    # http://127.0.0.1:8731/studies/seated-beat-001/player/

Opening `index.html` as a file:// URL will show the timing.json load error.

## Verified (20 Oct 2026, Claude desktop browser pane)

- Images: all four load at 1254×1254; controls disabled until loaded.
- Error path: timing pointed at a missing file → message names it, controls
  stay disabled, no broken image.
- Timeline (simulated 60 Hz clock): at 1× the cuts land at 0.75 s, 1.50 s and
  1.75 s, stopping at frame 95. At 0.5× they land at 1.50 s, 3.00 s and
  3.50 s. Frames never skip or go backwards, and exactly one drawing is on
  top at every step.
- Speed change mid-play continues from the same frame (24 → 24 → 36 after 1 s at 0.5×).
- Replay mid-play → frame 0 and playing. Play at the end restarts.
- Scrubbing while playing pauses and lands on the scrubbed frame.
- Beat boundaries by scrub: 17 neutral / 18 inhale / 35 inhale / 36 strum /
  41 strum / 42 singing; the badge shows only on inhale and strum.
- Prev/Next: 0→18→36→42→95; 50→42→36→18→0.
- Hidden page pauses. Loop wraps 95 → 0 when enabled.
- Phone 390×844: no horizontal scroll and the whole player fits in the
  viewport. Buttons are at least 44×44, the slider is 44 tall, and the loop
  label is 68×44. Desktop 962×807 fits without scrolling.
- Wall-clock playback was only partly observed: the app window was in the
  background, so the browser throttled rAF and paused the page as hidden.

Screenshot: `screenshot-phone-390-strum.jpg` (frame 36, candidate badge).

## Observed visual jumps (not concealed)

Measured on the full-resolution sources in the browser (canvas):

- **Registration:** the dark-pixel silhouettes (whole figure, hair, headstock,
  shoes) of all four drawings match to within ±1 px. No gross body or stool
  displacement.
- **Lower body/stool (280,840)–(1010,1160):** mean abs diff vs neutral is 5.26
  for inhale (matches the handoff's 5.256), with strum→singing 3.59. That is
  texture/pixel re-rendering, which may read as a faint shimmer on the jeans
  and stool at each cut.
- **Background tint shifts at every cut.** The corner cream is about
  (251,240,223) in neutral, (251,244,230) in inhale, (253,245,230) in strum and
  (253,244,226) in singing. The neutral→inhale cut is a visible warm-to-cool
  pulse of the whole frame, and the edge of the square stage shows faintly
  against the page cream.
- **Strum guitar body is redrawn:** the soundhole gains a rosette, and the
  pickguard and bridge shapes change. Guitar-body region diff is 11.5 vs
  inhale and 11.7 vs singing. The strumming hand moves below the soundhole as
  intended, then snaps back over it at the singing cut (frame 42), after only
  6 frames.
- **Head:** neutral looks up and right. Inhale, strum and singing turn
  frontal, tilted, with eyes closed. The head pose change at frame 18 is a
  single hard cut with no in-between. Strum adds raised/worried brows that
  were not in inhale, so the expression pops for 6 frames before singing.
- The fretting hand and headstock read as stable across all four.
