# Pour Me Out — first local review

Kashus Culpepper · Little KC · 18 October 2026

## Open

Open `index.html` in a browser. It is self-contained and requires no network, installation, or server. Nothing was deployed.

- Play / Pause or Space: play the cut.
- Timeline: scrub the cut.
- Shot buttons: jump to the ten approved shot starts.
- Left / Right arrows outside the slider: step one frame.
- Stage-reveal test: switch to the isolated five-second diagnostic test.
- Restart: stop and return to the beginning.

## Review files

- `pour-me-out-timing-animatic.webm`: 42 seconds, 1008 frames, 1280 × 720, 24 fps, silent.
- `stage-reveal-technical-test.webm`: 5 seconds, 120 frames, same format, silent.
- `shot-01.png` through `shot-10.png`: shot-start review frames.
- `reveal-end.png`: end-state for comparison with shot 05’s starting frame.
- `storyboard.json`: machine-readable approved timing and action notes.
- `MISSING-ASSETS.md`: source audit and production blockers.
- `validation.json`: playback / export checks.

## Scope

Uses the full approved ten-shot cut: 4 / 3 / 4 / 3 / 5 / 5 / 5 / 4 / 3 / 6 seconds. The alternative 36-second cut was not used.

This is a timing/layout pass with intentional missing-picture cues. Dashed brackets indicate intended frame occupancy only. They are not character proxies. Movement of the guide in shot 06 expresses the four-second crossing and one-second settle, not an approved walk animation. Most shot camera directions are annotations pending environment assets, not implemented scene cameras.

The isolated reveal test implements a slow screen-space forward-creep approximation through labeled abstract depth planes and a near occluder. It tests reveal pacing and parallax logic only. No Ryman architecture has been invented. It cannot validate lens geometry, physical camera distance, venue scale, or actual stage visibility. The 28mm annotation is the approved future scene-camera target.

The final shot reduces the empty occupancy guide over 4.5 seconds, holds, and fades during the final 0.48 seconds. With the actual scenery, this must become a backward aisle dolly with foreground pew parallax.

## Next production handoff

1. Ingest Jim’s original artwork and approved pose library without redesign.
2. Build reference-verified Ryman layout, then replace diagnostic planes with painted layers.
3. Use original pose cutouts for a true illustrated animatic. Implement the specified cameras in the environment, retaining the shot durations.
4. Select supplied audio, align the phrase, and revise durations only within the approved 30–45-second envelope if necessary.
5. Review character fidelity and room scale before animation polish.

`render.cjs` regenerates exports using the locally available browser and encoder paths. These paths are specific to this workstation. The player itself has no such dependencies.
