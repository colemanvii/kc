# PUNCHERS — production system

Engine, review player and exporter for the PUNCHERS episodes. Architecture: [`../PUNCHERS_PRODUCTION.md`](../PUNCHERS_PRODUCTION.md) · Character: [`../CHARACTER_PIPELINE.md`](../CHARACTER_PIPELINE.md) · Episode spec and asset swapping: [`../EPISODE_TEMPLATE.md`](../EPISODE_TEMPLATE.md).

Isolated from *The Arrival*: no existing file is modified, no dependencies are added. It reads Jim's derived layers from `public/little-kc/derived/` and leaves them alone.

## Run

```bash
npx vite --config punchers/vite.config.ts                          # review player → http://localhost:5180
node --test "punchers/**/*.test.ts"                                # engine + transport tests
node punchers/scripts/verify-rig.mjs                               # artwork fidelity gate
npx tsc -p punchers                                                # type-check
node punchers/scripts/render-frames.mjs --episode 001-pour-me-out --contact   # PNG sequence + review sheets
```

Player: `?ep=000-proof` or `?ep=001-pour-me-out` (default: newest) · `?t=12.5` to freeze a moment · Space play/pause · ←/→ one frame · Shift+←/→ one bar · click a shot label to jump to it · **guides** (safe areas and source-resolution readout) is off by default · **click** toggles the tempo click.

## Layout

```
engine/       tempo.ts · timeline.ts · rig.ts · camera.ts · episode.ts · load.ts   (pure TS, no DOM)
proof/        index.html · main.ts · render.ts (Canvas 2D) · transport.ts (audio clock)
scripts/      verify-rig.mjs · render-frames.mjs
characters/   little-kc/rig.json (cut-out rig) · little-kc/poses.json (pose library)
environments/ jims-sheet (real) · ryman-backstage · ryman-reveal · ryman-house · ryman-mic (blockouts)
episodes/     000-proof (Jim's art, 3 shots) · 001-pour-me-out (approved 10-shot board)
```

## What is visually real vs placeholder

| | Real | Placeholder |
|---|---|---|
| **000-proof** | Jim's drawing (figure, ground line, specks, paper), pixel-verified; camera moves; cuts; beat-locked float and sway; the lift | Tempo (76 → 70 bpm) and the click: no song exists in the repo |
| **001-pour-me-out** | Shot order, exact timings (4/3/4/3/5/5/5/4/3/6 s = 42 s, 1008 frames), lenses, camera moves, staging marks, KC's on-screen scale per the approved board, the reveal parallax, the end retreat and fade | **Everything drawn**: every KC pose is a dashed red bracket labelled with the drawing it waits for; every set piece is a labelled grey depth card. No character or venue art is invented. Tempo (60 bpm) is a stand-in, so bar numbers show as `~` |

## Verification record (18 Oct 2026, this branch)

| Check | Result |
|---|---|
| `node --test "punchers/**/*.test.ts"` | **32 / 32 pass** (tempo 4, timeline 3, rig 3, camera 1, episode 000 5 + report, episode 001 6, determinism 1, fidelity 1, swap 2, transport 5) |
| `node punchers/scripts/verify-rig.mjs` | **OK**: 173,605 opaque pixels bit-identical to the master; 0 of 173,192 ink pixels left out |
| `npx tsc -p punchers` | clean (strict) |
| `npx vite build --config punchers/vite.config.ts` | builds: 34 kB JS (13.6 kB gzip), no runtime deps |
| Render 001, every frame | 1008 frames, 1280×720 @ 24, no page errors → `episodes/001-pour-me-out/review/shots.jpg` (all 10 shots: in/mid/last) |
| Render 000, every frame | 935 frames, no page errors → `episodes/000-proof/review/` |
| Existing site: `npm test` | 6 / 6 pass, 173,670 stroke pixels match master (unchanged) |
| Existing site: `npm run build` | builds (unchanged) |
| Browser player (in-app Chrome) | Both episodes load with no console errors; guides off by default; play/pause/scrub/shot-jump work; 2.0 s wall clock → 2.125 s picture (rAF jitter) |

Specific guarantees under test:
- **Deterministic transitions:** every cut lands on an exact frame; the frame before a cut belongs to the previous shot; every frame of both episodes evaluates identically in random order.
- **Audio sync through seek/pause/resume** (fake clock, output latency 21 ms): stem start time and offset, every live click, and picture time all satisfy one anchor equation to 1e-6 s; clicks scheduled past a pause are dropped; resume never steps the picture backwards.
- **No procedural distortion:** every sprite in every third frame of both episodes has a similarity transform (uniform scale, no shear, no mirror). This test caught and removed a horizontal stretch of the ground line.
- **Swap by data:** a pose drawing and an environment painting replace their placeholders at their own proportions with JSON edits only; a file without its pixel size is refused.

Not verified here: real-time playback judged by eye on target devices (the in-app pane can't be watched live), and anything needing the song or approved drawings.

## Blockers

1. **Jim's drawings** for Episode 001: seated, stand, walk keys, rear, sing, hand-open, release (+ mouth shapes), at ≥ 1250 px character height. Ideally also the layered original of the floating drawing.
2. **The recording** of *Pour Me Out*, the chosen excerpt (`audio.offset`), and its measured beat-times.
3. **Ryman reference package** (stage-to-house, house-to-stage, balcony, pews, wings), then painted plates.
4. Blender (layout) and ffmpeg (optional encode) are not installed. After Effects and Media Encoder are.
