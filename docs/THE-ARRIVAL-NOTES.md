# The Arrival — concept, timing and production notes

First study (V1), branch `the-arrival`. Not deployed.

## Concept

The page is the sheet of paper. Nothing on it at first but the paper's grain and
three stray specks from the original drawing. Then Little KC drifts down into frame
beneath his two balloons, as if a breeze carried him in. He sinks a touch past his
mark, the balloons lift him back, he bobs a few times, slower and smaller each time,
and then he stops. The last frame is Jim's drawing exactly, pixel for pixel. There is
no UI apart from a faint italic *again* that appears once he is still.

## Beats

| t (s)     | Beat       | What happens |
|-----------|------------|--------------|
| 0 – 1.2   | Paper      | Empty sheet. The page waits a moment before anything moves. |
| 1.2 – 6.2 | Descent    | He comes in feet first from just above the frame, already moving. The ground line fades in and narrows as he gets closer to it. |
| ~6.0      | Dip        | He sinks ~10 px (master px) past his rest position. |
| 6 – 14    | Buoyancy   | A slow vertical bob (5.2 s period) that decays on a 4.2 s time constant: about −7, +4, −2, +1 px. |
| 14 – 20   | Stillness  | Whatever drift is left is windowed down to exactly zero. Then the hold frame, and *again* fades in. |

Total ≈ 20 s, but the arrival reads as finished at ~6 s. After that the motion is
small enough that you sense it more than see it.

## Easing and motion choices

- **Descent: `(1 − p)^2.2` over 5.0 s.** He enters with real velocity, because he was
  already flying before the frame caught him. Then he decelerates for a long time.
  The velocity at the end is zero, so the buoyancy takes over without a seam. I didn't
  use a fade or a linear slide.
- **Breeze: x drifts 56 px from the right with `(1 − p)^2.6`.** The drift settles a
  little before the fall does, so his path is a gentle curve, not a straight line.
- **Pendulum swing, simulated rather than keyframed.** The rigid figure rotates about a
  pivot between the balloon knots. While he drifts, drag holds a lean proportional to
  his velocity (0.05°/px·s⁻¹, about −1.5° at entry). As the breeze dies, a damped
  pendulum (3.6 s period, ζ 0.2) relaxes through it:
  `θ'' = −ω²(θ − θ_drag) − 2ζωθ' − aₓ/L`. The equation is integrated once at 240 Hz
  into a lookup table. Because the tilt comes from the motion itself, it never looks
  scripted.
- **Depth:** scale goes from 0.965 to 1 during the descent. That's enough to feel him
  come forward without it reading as a zoom.
- **Shadow:** the drawn ground line answers his height. It's up to 32% wider and fully
  transparent while he is high, then gathers to the drawn line. During the dip it
  tightens very slightly.
- **Stillness is deliberate.** There is no perpetual idle loop. The hold frame is the
  original composition, and it stays put.

## How the layers were made (and how faithful they are)

The master `bea8729f-ce73-440b-804f-88e87d98273d.jpeg` (1523 × 1536) is never modified.
`scripts/extract-layers.mjs` derives the layers from it:

1. **Paper colour** = the per-channel median of the sheet: RGB 239/222/201. The paper is
   flat, with no vignette, and grain σ ≈ 5.
2. **Alpha only.** Each layer is a straight-alpha PNG. Its RGB values are the master's
   own pixels, unaltered. Alpha ramps from 0 to 1 as a pixel's largest per-channel
   difference from the paper goes from 15 to 26 (about 3σ–5σ of grain). Nothing is
   traced, recoloured, redrawn or inpainted.
3. **Cuts only where there is no ink.** The ink forms separate islands on the paper.
   Each layer is a rectangle, and the script refuses to run if any stroke touches a
   rectangle's border.
   - `figure.png`: KC, hat, both balloons, strings, horns and halo, as **one rigid
     piece**.
   - `shadow.png`: the ground line.
   - `mark-1..3.png`: three stray specks. They stay fixed with the paper.
   - `paper.jpg`: an empty 384 px patch of the real sheet, mirrored 2 × 2 into a
     seamless tile.
4. **Verified.** `npm run verify:layers` recomposites the rest frame. All 173,670 opaque
   stroke pixels match the master **exactly**. Whole-sheet PSNR is 30.5 dB, and that
   residual is only paper grain, which the tile now supplies.

A note on method: I first tried a multiply/"divide by paper" ink layer. I dropped it
because parts of the blue balloon are brighter than the paper in the blue channel, and
multiply cannot reproduce those pixels. The alpha method is exact.

## What I did *not* separate, and why

The brief allows animating the balloons, strings, face and hat separately only if the
extraction is faithful. From this flattened JPEG it isn't:

- The **strings** run continuously into his hand. Separating the balloons would mean
  cutting each string and bending or redrawing it at the joint.
- The **hat** overlaps his hand.
- **Face, hair and body** share outlines. Moving any of them would leave holes that
  would need invented anatomy behind them.

So V1 moves the whole figure as a rigid piece, with physically motivated motion, plus
the separately drawn ground line. **Independent balloon sway, string flex, hat motion
or facial life need an editable layered source from Jim** (e.g. the original
Procreate/PSD file with balloons, strings, hat, head and body on separate layers).

## What works / what's rough / blockers

**Works (verified):**
- `npm run build` passes (tsc strict + Vite). Total JS 4.7 kB, no runtime dependencies.
- `npm test`: 6 choreography tests (empty opening, exact rest end state, finite and
  continuous frames, restrained dip/tilt, shadow behaviour), plus the pixel-fidelity
  check.
- `npm run capture`, using headless Chrome with device emulation:
  - The rest frame fits with no overflow at phone 390×844, phone landscape 844×390,
    tablet 820×1180 and desktop 1440×900.
  - Real playback ran 1169 frames to rest, p50/p95 16.7 ms.
  - Reduced motion renders the still drawing immediately.
  - Key frames are in [`captures/`](captures/), with the phone sequence in
    [`captures/phone-filmstrip.jpg`](captures/phone-filmstrip.jpg).
- Motion visitors start on empty paper with no flash of the figure. If the script
  fails, an inline failsafe reveals the drawing after 6 s. Without JS, a `<noscript>`
  shows the original JPEG.
- If the tab is hidden, the clock pauses rather than skipping ahead.

**Rough / to judge in person:**
- Timing has been checked through frozen frames (`?t=`) and measured pacing. A person
  still needs to watch it in real time on a real phone. I could not watch it live in
  a foreground browser.
- The rigid swing pivots the balloons along with the body. At under 1.6° this reads as
  the whole bunch swaying, but true string physics needs the layered source.
- The phone-landscape figure is small (237 px tall) because it is height-bound. That's
  acceptable for a first study.
- `figure.png` is 531 kB. WebP lossless would roughly halve it; I left that out to keep
  V1 simple.
- There is no sound. The README mentions audio as a future consideration.

**Blockers:** none for V1. Richer character motion is blocked on a layered source file.

## Hooks for a later motion pass (Astra)

- All timing constants live in `TIMING` and at the top of
  `src/animation/arrival.ts`. The choreography is a pure `pose(t)` function.
- `?t=<seconds>` freezes any moment, for review.
- `src/experiences/arrival/scene.ts` is the only code that touches the DOM. Swapping in
  GSAP or new layers would happen there, without changing composition or assets.
