# PUNCHERS — Production Architecture

*An original animated music series by Kashus Culpepper, starring Little KC (character design: Cole Calfee).*
Branch `claude/punchers-production-system`. Nothing here is deployed or merged.

## 1. What the repository actually contains (audit, 18 Oct 2026)

| Area | Found | Notes |
|---|---|---|
| Character artwork | **One** drawing: `bea8729f-…jpeg`, 1523 × 1536, flattened JPEG, Little KC floating under two balloons with his hat in hand | No layered source, no other poses, no turnaround, no mouth shapes |
| Derived layers | `public/little-kc/derived/`: `figure.png`, `shadow.png`, 3 specks, paper tile, `manifest.json` | Cut from the JPEG by alpha only; RGB is the master's own (see `CHARACTER_PIPELINE.md`) |
| Animation experiments | *The Arrival* V1 (`src/`, branch `the-arrival`): pure `pose(t)` choreography, DOM layers, tests, capture script | Untouched by this branch. Preserved and still passing |
| Frameworks | Vite 6 + TypeScript 5, no runtime dependencies; `sharp`, `puppeteer-core` dev-only | PUNCHERS adds **no** dependencies |
| Audio | **None** | No *Pour Me Out* recording or stem, no tempo map |
| Ryman / environments | **None** | No reference photos, plans, or painted scenery |
| Workstation tools | After Effects 2026, Media Encoder 2026, Photoshop 2026, Illustrator 2026, Chrome | **Blender and ffmpeg are not installed** |
| External previs | Separate local review folder (outside this repo): approved 42 s ten-shot board, timing animatic, missing-assets register | Its `storyboard.json` is copied into `punchers/episodes/001-pour-me-out/source/` for provenance. That pass could not decode its character file; **this repo's master JPEG decodes and is verified** |

## 2. The core decision: Cole's drawings are data, never re-made

Every frame of the show is assembled from approved drawings, never a re-drawing. The pipeline treats
artwork the way a film lab treats negatives: verified at ingest, only ever transformed (moved,
rotated, scaled uniformly, faded), never retouched, filtered or regenerated. Where a drawing doesn't
exist yet, the frame shows a **labelled placeholder slot**: never a proxy character or venue.

This is enforced in code, not policy:
- `punchers/scripts/verify-rig.mjs`: every shown pixel of every part equals the master bit-for-bit; no ink left behind.
- `engine.test.ts`: every sprite in every frame of every episode has a similarity transform (no stretch, shear or mirror).
- The engine refuses an approved file without its pixel size, so it can only ever be scaled at its own proportions.

## 3. Architecture

```
            ┌───────────── Episode folder (JSON, versioned in git) ──────────────┐
            │ episode.json   tempo map · markers · audio · cast · delivery       │
            │ shots/*.json   in/out (musical or seconds) · lens · camera · staging│
            └──────────────┬─────────────────────────────────────────────────────┘
                           │ compileEpisode()  (pure TypeScript, no DOM)
  characters/*/rig.json ───┤   tempo.ts     bars:beats ↔ seconds (segments or measured beat-times)
  characters/*/poses.json ─┤   timeline.ts  keyframes + beat-locked performance layers
  environments/*/…json ────┤   rig.ts       artwork-preserving cut-out hierarchy
                           │   camera.ts    2.5D multiplane pinhole (dolly ≠ zoom; real parallax)
                           ▼
                 frameAt(seconds) → Frame   (renderer-neutral: shot, bar:beat, camera, drawables)
                    │                 │                         │
         browser preview      render-frames.mjs          (next) AE / Blender bake
     (Canvas 2D, audio clock)  PNG sequence + sidecar     camera + layer keyframes
```

Principles:
- **Musical time is the authoring clock.** Cuts and cues are written `"9:1"` or `"@chorus+2bars"`. When the real tempo map arrives, every shot re-times itself (tested).
- **The audio clock is the master clock.** Picture = f(AudioContext time − output latency). Stem, click and picture share one anchor through seek/pause/resume (tested against a fake clock).
- **Frames are pure functions of time.** Random-order evaluation equals in-order (tested on every frame of both episodes), so scrubbing, parallel export and review agree.
- **Performance runs through cuts; cameras belong to shots.** A cut can't pop a pose.
- **One renderer path** for preview and export: what you review is what renders.

## 4. Where each tool belongs

| Stage | Tool | Why |
|---|---|---|
| Character drawings, poses, mouth shapes | **Cole's own tool** (Procreate/Photoshop), exported as layered PSD or per-layer PNG at ≥ 4K-ready resolution | The art is Cole’s. We ingest; we don't redraw |
| Ingest + fidelity gate | `verify-rig.mjs` (Node + sharp) | Bit-exact proof before anything is animated |
| Environments (Ryman) | **Painted layers** (Photoshop) from a verified reference package; **Blender** only for layout: measure the room, block camera paths, export plate positions/depths | Blender gives correct venue scale and lens geometry; the *look* stays painted and handmade. Blender is not installed yet |
| Blocking, timing, animatic, camera | **This engine** (JSON + browser player) | Musically timed, versioned in git, reviewable by link, deterministic |
| Character performance | Engine for rig motion and pose timing; drawing swaps (replacement animation) for walk, sing, mouth | Matches hand-drawn character craft; no puppet warping |
| Final comp, light, grain, grade | **After Effects** (installed) from PNG sequences + camera bake | Lighting, atmosphere, film texture: craft that belongs in compositing |
| Encode / masters | **Media Encoder** (installed); ffmpeg if added | ProRes 4444 master, H.264/H.265 deliverables |
| Web | Interactive companion pieces (e.g. *The Arrival*) and the review player. **Episodes ship as rendered video**, not live web animation | Rendered video guarantees quality, sync and portability on every platform |

## 5. Resolution: a real constraint, quantified

The master is 1523 × 1536. The test suite reports how much Cole's pixels are enlarged at each shot's tightest framing (Episode 000):

| Shot | 720p | 1080p | 2160p |
|---|---|---|---|
| SH010 wide | 0.56× | 0.84× | 1.69× |
| SH020 medium | 0.84× | **1.26×** | **2.52×** |
| SH030 high wide | 0.51× | 0.77× | 1.54× |

Anything above 1.0× softens the linework. The board's closest shot (SH080, 85 mm) frames KC at 58% of frame height. At 2160p, KC needs to be drawn **≥ 1250 px tall** (≈ 4× the current figure). **Ask Cole for originals at the largest canvas Cole works at.**

## 6. Status

Working, tested and rendering: the engine, the browser player, frame export, the fidelity gate, Episode 000 (Cole's real art) and Episode 001 (the approved ten-shot board, all slots placeholder).
See `punchers/README.md` for commands, the swap guide and the full verification record.
