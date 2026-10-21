# SH050 coverage preparation — awaiting production artwork

Baseline: `10aa19e`, following `PUNCHERS_HANDOFF.md` at `934ccd6`. Isolated branch: `astra/ryman-reveal`. No merge or deployment.

## Changes

- House rect: x −460, y −1495, w 6770, h 3830. Covers the full camera union with overscan.
- Stage floor band: x −175, y 1000, w 6200, h 1170. Covers the visible floor width and lower edge; it is not an opaque full-frame backdrop.
- Curtain rect: x −900, y −1140, w 1570, h 3440. Covers the opening height and clears the frame by the closing frame. Its right edge goes from 112.36px to −6.92px at 720p.
- Camera, shot JSON, depth ordering and timing remain byte-for-byte unchanged. SH050 occupies episode frames 336–455: 120 frames, 24 fps, five seconds.

## Verification

- Arrival tests: 6/6; all 173,670 opaque stroke pixels match the master.
- Arrival build and PUNCHERS strict type check: pass.
- PUNCHERS engine/transport tests: 32/32, including a repeat after the final curtain adjustment.
- Rig verifier: zero missing ink pixels; 173,605 full-opacity pixels match bit-for-bit.
- Episode 001: 1,008 frames rendered at 1280×720/24 fps, including all 120 SH050 frames; no reported page errors.
- Episode 000: 935 frames rendered successfully; regenerated review images have no git diff.
- Per-frame projection checks: house coverage, floor-band coverage, curtain vertical coverage, correct shot identity, and opening/closing curtain position pass across all 120 frames. See `sh050-coverage.json`.
- Inspected opening/middle/closing contact sheet. Gray placeholder boundaries remain intentional. This is not a cinematic artwork approval.
- Near-to-far plane scales and existing depth ordering are preserved. Architectural perspective, painted texture stability, transparent seams, registration, and final artwork parallax require the actual layers and remain unverified.

## Asset status and next action

House, stage, curtain and KC rear pose all remain labelled placeholders. No approved artwork has been integrated. The user confirmed that the latest approved stage-wing composition with a microphone in warm light is in ChatGPT, and that registered layers have not yet been exported. A flattened Gemini JPEG found in Downloads was inspected but not used; its approval/version was not established.

Place `house.png`, `stage.png`, and `curtain.png` in this checkout's `public/punchers/environments/ryman-reveal/`. Read that folder's README for export requirements. Preserve originals under `art/source/ryman/<date>-<description>/`.

The slots retain `file: null`, and environment status remains `blockout`. Do not set fabricated dimensions or weaken the placeholder-art test before approved exports arrive. When they arrive, set exact `size` and `file`, fit shared registered rectangles to the real canvas aspect ratio, rerun coverage/render checks, and perform the handoff's approved-art test replacement.

`sh050-blockout.html` is a self-contained five-second player for the rendered placeholder frames. `sh050-contact.jpg` shows frames 336, 396 and 455. Full PNG sequences remain local under `.scratch/punchers/`.
