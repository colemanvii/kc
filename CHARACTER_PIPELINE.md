# Little KC — Character Pipeline

How Jim's artwork gets onto the screen without ever being redrawn, approximated or distorted.

## 1. What the current character layers are (answering this plainly)

**The layers are derived from the flattened JPEG, not original source layers.**

| File | Origin |
|---|---|
| `bea8729f-ce73-440b-804f-88e87d98273d.jpeg` | Canonical master. Single flattened image. Never modified. |
| `public/little-kc/derived/figure.png` (750 × 800) | Alpha-cut from the master by *The Arrival*'s `scripts/extract-layers.mjs`: KC, hat, both balloons, strings, horns and halo as **one rigid piece** |
| `public/little-kc/derived/shadow.png` | The drawn ground line, cut the same way |
| `mark-1..3.png`, `paper.jpg` | Stray specks and a patch of the real paper (environment, not character) |

How they were cut: alpha only. RGB is copied from the master unchanged; alpha ramps on the ink's distance from the paper colour. Each cut is a rectangle placed where the ink has no neighbours, so no stroke is severed. Nothing is traced, recoloured, inpainted or reconstructed.

Verified by `node punchers/scripts/verify-rig.mjs`:
```
shadow     shadow.png     356×52 at (466, 1146)  every shown pixel is the master's
body       figure.png     750×800 at (440, 330)  every shown pixel is the master's
coverage   173192 ink pixels in the character's bounds, 0 not shown by any part
opaque     173605 full-opacity pixels checked bit-for-bit
OK
```

**What this means:** the figure can move as a whole (drift, sway about the balloon knot, float, rise, scale uniformly). It **cannot** walk, sit, turn, sing, or move his hat, face, strings or balloons independently. Those would need anatomy hidden under other strokes, which this JPEG doesn't contain and we won't invent.

## 2. Two ways a character enters an episode

### A. Cut-out rig (`characters/<name>/rig.json`): for a drawing to move as parts
- Each **part** = one cut of a master: file + the exact master rectangle it came from + pivot + parent + depth.
- Pose channels per part: `tx ty rot sx sy opacity`, named `<cast>.<part>.<channel>` in timelines.
- **Rest-pose invariant:** at rest every world transform is exactly the identity, so the composite *is* the master. Tested with exact equality (`0 === -0`, no epsilon).
- **Drivers** derive bookkeeping channels (e.g. the ground line answers KC's height). Drivers scale **uniformly**. A horizontal-only stretch of the ground line (as *The Arrival* does) was caught by the fidelity test and removed here.
- `notCharacter` declares regions inside the character's bounds that belong to the sheet (two paper specks), so the coverage check stays strict about everything else.

### B. Pose library (`characters/<name>/poses.json`): for replacement (drawing-swap) animation
- One entry per approved drawing: `file`, its pixel `size`, `anchor` (default: feet), notes.
- A shot picks a pose (`"cast": { "kc": { "pose": "sing" } }`); staging sets where (`kc.x`, `kc.y`) and how tall (`kc.h`). Width is always `h × (size.w / size.h)`, so the drawing keeps its own proportions.
- `file: null` → a dashed, labelled bracket ("Little KC · rear: awaiting Jim's drawing"). Never a silhouette or stand-in.
- Walks, singing and mouth sync are sequences of approved drawings (keys + in-betweens Jim draws or approves), swapped on the beat grid. **Mesh warping and puppet deformation of Jim's art are out of scope by design.**

Current library: `floating` (approved, the master figure) plus `seated`, `stand`, `walk`, `rear`, `sing`, `hand-open`, `release`, all **missing**.

## 3. What to ask Jim for (in priority order)

1. **The original working file** of the floating drawing (Procreate/PSD) with the balloons, strings, hat, head, body and arms on separate layers, at full canvas resolution. That unlocks balloon sway, string flex, hat motion and head turns on the drawing we already have.
2. **Episode 001 pose drawings**, per the approved board: seated on stool; standing (profile and front); walk keys (contact, passing, both feet); rear view at the threshold; singing at mic; close-up with chin lift and open hand; release.
3. **Mouth shapes** for vocal sync (a small set: closed, A/I, O, E, M/B/P, F/V, L, rest), drawn to sit on the singing head.
4. **Resolution:** KC ≥ 1250 px tall for 2160p close-ups (see `PUNCHERS_PRODUCTION.md` §5).
5. **Format:** layered PSD, or one PNG per layer with a shared canvas size and **no** trimming, so every layer keeps its registration. Straight alpha. sRGB. Plus a flattened reference export of the same file: the verify gate compares every layer against it.

## 4. Ingest procedure (each delivery from Jim)

1. Commit the untouched originals under `art/source/<date>-<description>/` (never edited; LFS if large).
2. Export layers 1:1 (no resample) to `public/punchers/characters/little-kc/…`.
3. Write the part rectangles or pose entries (`rig.json` / `poses.json`) with each file's exact pixel size.
4. Run `node punchers/scripts/verify-rig.mjs` and `node --test "punchers/**/*.test.ts"`. Both must pass.
5. Render a review sheet (`render-frames.mjs --episode … --contact`). Jim signs off on the sheet before animation polish.
