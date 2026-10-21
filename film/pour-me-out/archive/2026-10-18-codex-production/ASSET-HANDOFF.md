# Finished five-second reveal — asset handoff

## Milestone

One visually finished five-second Shot 05, matching the approved storyboard: Little KC small at the threshold, the empty Ryman opening beyond him, warm theatrical light, handmade texture, restrained motion. No new technical animation pass is requested. The approved 42-second animatic stays unchanged until actual audio is supplied.

## Minimum package: four artwork files plus one manifest

All four delivered PNGs use the same **2560 × 1440** registered canvas, sRGB. They composite directly at frame zero. This is twice the existing 1280 × 720 review coordinate system. Keep original layered masters separately; do not flatten Little KC into the environment.

| File | Required contents |
|---|---|
| `ryman-room.png` | Gemini’s approved empty Ryman environment: house, balcony, distant pews, warm light and painted texture. Opaque full-frame base. Fill behind every foreground layer so motion does not expose holes. |
| `ryman-near.png` | Nearer stage-floor / pew details separated from the approved environment, transparent elsewhere. Preserve the original approved composition. |
| `ryman-curtain.png` | Approved stage-side curtain or other existing foreground occluder, transparent elsewhere. At frame zero the occluding right edge is around x=780 on the delivery canvas. Its existing movement clears 190 pixels left across five seconds. |
| `little-kc-rear.png` | Jim’s exact approved rear or rear-three-quarter pose, transparent background, positioned on the shared canvas. Foot anchor x=665.6, y=1036.8; figure height approximately 129.6 pixels (9% of frame height). Do not redraw, mirror, distort, recolor or synthesize a missing view. Have Jim supply/approve the required view. |
| `assets.json` | Copy `assets.template.json`; supply approval references and mark approvals only when actually granted. Include four exact filenames. |

The character height is intentionally small in this wide shot. One still pose is sufficient for the reveal; a walk cycle, singing mouth set, stool, and microphone are not needed to finish this shot. Separate haze, dust, and light passes are optional, not prerequisites. Approved light and paper texture may remain baked into the environment layers.

A single flattened Gemini environment can be archived as the approved master, but cannot satisfy independent foreground parallax. Request registered layer exports and a clean background from the same approved environment; do not invent unseen areas or regenerate substitute scenery. If the approved composition cannot meet these anchors, register the assets before integration. Do not change the motion to compensate silently.

## Locked motion and registration

`motion.js` extracts the baseline reveal’s exact five-second smoothstep curve, four depth-plane transforms, and 95-pixel review-space occluder travel. Artwork is independently registered at frame zero. Two of the existing four depth tracks are used by the minimum package; the remaining tracks are preserved in the motion sampler for later approved layer separation.

- Room → original plane 3: scale 1.000 → 0.95 / 0.89 (1.0674157), no horizontal offset.
- Near details → original plane 0: scale 1.000 → 0.53 / 0.50 (1.06), horizontal offset 0 → 18 review pixels.
- Pivot → x=760, y=340 review pixels (1520, 680 in delivery canvas).
- Curtain → x translation 0 → −95 review pixels, no scale.
- Character → unchanged position and scale, matching the baseline reveal guide.
- Review interval → 0–5 seconds, 24 fps, 120 output frames. Frame 119 samples 4.958333s; the scrubber also exposes the endpoint at 5s.

This preserves the existing 2.5D screen-space motion. It does not convert it into a physical 28mm camera or rebuild the room in 3D. The approved 28mm reference remains an art-direction target. The old technical frame’s labels, rectangles, tint and procedural grain are not included in the production renderer: final visual treatment comes from approved artwork only.

## Local integration

Open `reveal-scene.html` and choose the manifest plus four PNG files together. Files stay on this computer. The intake checks manifest approval records, layer roles, filenames, image decoding, and dimensions. It intentionally stays blank and disables playback for missing or invalid files. Approval fields record human decisions; they do not independently prove provenance or visual quality.

Actual asset integration must verify alpha coverage, registration, complete coverage at all frames, curtain clearance, original character fidelity, and approval against the Gemini master. These checks cannot be completed before files arrive. The performer is composited in front of the near occluder to match the baseline guide; ensure the approved curtain placement does not require a different character overlap.

## Acceptance before export

1. Jim’s source and approved rear view match the visible character exactly.
2. Ryman identity and composition match the approved Gemini environment; no invented architecture.
3. No holes, sliding surface textures, edge halos, or unexpected clipping during the entire five seconds.
4. Character remains approximately 9% of frame height; scale and quietness survive the reveal.
5. Export only after real assets pass review. No additional placeholder video is produced.
6. Integrate the actual song later; keep the existing 42-second timing files untouched now.
