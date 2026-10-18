# PUNCHERS — Production Handoff

**Baseline:** commit `10aa19e` on `claude/punchers-production-system` is the frozen technical baseline.
**Next milestone:** a finished cinematic **stage-reveal test** (Episode 001, SH050) made with approved artwork. This milestone needs no engine development: everything below is done with image files and JSON edits.

Nothing in this document requires changing `punchers/engine/`, `punchers/proof/`, `punchers/scripts/`, or anything belonging to *The Arrival*.

---

## 0. The milestone: SH050 "Ryman reveal"

| | |
|---|---|
| Shot | `punchers/episodes/001-pour-me-out/shots/sh050.json` |
| Time | 14.000 – 19.000 s · frames **336 – 455** (120 frames @ 24 fps) |
| Board direction | "Hold Little KC small. Let the room open in layers. Slow forward creep past curtain." 28 mm |
| Environment | `punchers/environments/ryman-reveal/environment.json` (3 slots: `house`, `stage`, `curtain`) |
| Character | `kc` in pose `rear`: Jim's rear-view drawing (**missing**; see §3) |
| Camera (as approved in the blockout) | x 2922.2 → 3012.2, y 416.7, frame 3333.3 → 2866.7 (inOutSine), lens 28 mm = 28.07° vertical |

**Definition of done**
1. `house`, `stage` and `curtain` slots hold approved Ryman paintings (§1). No labelled grey cards remain in frames 336–455.
2. Every backdrop plate covers the full frame for all 120 frames (coverage table in §2.4). No bare ground shows at any edge.
3. The curtain leg clears the frame as the camera creeps forward. It reads as the nearest layer, with the room opening behind it.
4. KC is either Jim's approved `rear` drawing, or the labelled bracket if that drawing hasn't arrived yet. The test can be judged as an environment reveal first. **Never a stand-in figure.**
5. The full gate (§5.3) passes, and the review sheet `punchers/episodes/001-pour-me-out/review/shots.jpg` is regenerated and approved.

---

## 1. Integrating approved Ryman artwork into Episode 001

### 1.1 Where files go

```
public/punchers/environments/ryman-reveal/house.png      ← approved painting files (served at /punchers/…)
public/punchers/environments/ryman-reveal/stage.png
public/punchers/environments/ryman-reveal/curtain.png
public/punchers/environments/ryman-backstage/…           (SH010–SH040, later)
public/punchers/environments/ryman-house/…               (SH060, SH100, later)
public/punchers/environments/ryman-mic/…                 (SH070–SH090, later)
art/source/ryman/<date>-<description>/                   ← untouched layered originals (PSD), for provenance
```

The `assetBase` of each environment JSON already points at its folder, e.g. `"/punchers/environments/ryman-reveal/"`.

### 1.2 The edit: one plane at a time

Each slot plane turns from placeholder to painting when `file` and `size` are set:

```jsonc
// punchers/environments/ryman-reveal/environment.json
{
  "id": "ryman-reveal",
  "status": "blockout",                 // → "approved" when all three planes are final
  "assetBase": "/punchers/environments/ryman-reveal/",
  "ground": [30, 28, 26],               // fill behind everything; set to the house's deepest tone
  "planes": [
    { "id": "house",   "kind": "slot", "z": -900,
      "rect": { "x": -441, "y": -1475, "w": 6730, "h": 3790 },   // must cover the frame (§2.4)
      "file": "house.png", "size": [4400, 2478], "label": "…" },
    { "id": "stage",   "kind": "slot", "z": -250, "rect": { … }, "file": "stage.png",   "size": [W, H], "label": "…" },
    { "id": "curtain", "kind": "slot", "z": 520,  "rect": { … }, "file": "curtain.png", "size": [W, H], "label": "…" }
  ]
}
```

Field rules (enforced by the engine at load time):

| Field | Meaning |
|---|---|
| `file` | File name under `assetBase`, or a root-absolute path. `null` = labelled placeholder. |
| `size` | **Required with `file`:** the file's exact pixel `[width, height]`. Without it the episode refuses to load. |
| `rect` | Where the painting sits on its plane, in sheet px (§2.1). The painting is fitted *inside* the rect, centred, at its own proportions. **Set `rect.h = rect.w × size[1] / size[0]`** so it fills the rect exactly; otherwise it is letterboxed inside it. |
| `z` | Plane depth (§2.2). Changing z changes parallax: lower is further away and slower. |
| `label` | Ignored once `file` is set. Keep it for the asset register. |

### 1.3 The blockout rects are not the final layout

The blockout planes were sized for labels, not for full coverage. The SH050 house card stops at x 4000 while the camera sees out to x 6285. **Before painting, set each backdrop rect to at least the coverage in §2.4.** Then fit the composition to the verified Ryman reference. Moving the camera is also allowed, but the shot timing and the board's framing of KC (≈ 9% of frame height, left third) are approved: keep them.

---

## 2. Directories, fields, dimensions and coordinates

### 2.1 Coordinate system ("sheet px")

- One unit = one **sheet pixel**. Origin top-left; **x right, y down**. For Episode 000 a sheet pixel is exactly a pixel of Jim's master JPEG. For the Ryman sets it's an arbitrary layout unit: **KC standing ≈ 300 sheet px tall** is the reference scale every set uses.
- Every plane is a flat card parallel to the screen, at depth **`z`** (sheet px, **positive = toward the camera**). The paper/stage reference plane is `z = 0`.
- Cast depth: `kc` stands at `z = 20` (from `episode.json` → `cast.kc.z`).

### 2.2 Camera

| Channel | Meaning |
|---|---|
| `camera.x`, `camera.y` | The point on the `z = 0` plane at frame centre |
| `camera.frame` | How many sheet px of the `z = 0` plane fill the frame **vertically**. Changing it is a **dolly**: the camera moves |
| `camera.lens` / shot `lensMm` | Vertical FOV. `lensMm` uses a 14 mm gate (Super 35 16:9): 28 mm = 28.07°, 35 mm = 22.6°, 50 mm = 15.9°, 65 mm = 12.3°, 85 mm = 9.42° |
| `picture.fade` | 0 → 1 fades to black |

Camera distance `D = frame / (2·tan(fov/2))`. A plane at depth `z` is drawn at **`(720 / frame) · D / (D − z)` screen px per sheet px** (at 720p), so nearer planes grow and move faster: real multiplane parallax. Keep `z < 0.95·D`. In SH050, D runs 6667 → 5734, so any z up to ≈ 5400 is legal.

### 2.3 Painting resolution

Measured over every frame of every shot (peak enlargement of each plane):

| Plane | z | Peak screen px per sheet px | Shots |
|---|---|---|---|
| `ryman-reveal.house` | −900 | 0.326 @1080 · 0.652 @2160 | SH050 |
| `ryman-reveal.stage` | −250 | 0.361 @1080 · 0.722 @2160 | SH050 |
| `ryman-reveal.curtain` | 520 | 0.414 @1080 · 0.828 @2160 | SH050 |
| `ryman-backstage.*` | −300…40 | 1.06–1.17 @1080 | SH010–SH040 |
| `ryman-house.*` | −500…420 | 0.57–0.71 @1080 | SH060, SH100 |
| `ryman-mic.house` | −700 | 1.71 @1080 | SH070–SH090 |
| `ryman-mic.mic` | 40 | 2.12 @1080 | SH070–SH090 |

**Required pixels = rect size (sheet px) × peak factor**, for the delivery height you are mastering. Paint at or above that and the engine only ever reduces your painting, never enlarges it.

### 2.4 Coverage: what each backdrop must span

The union of everything the camera sees on each plane, across all frames of the shots that use it:

| Plane | Coverage rect (sheet px) | Full-bleed plate ≥ @1080 | @2160 |
|---|---|---|---|
| **`ryman-reveal.house`** | x −441, y −1475, w 6730, h 3790 | **2200 × 1240** | **4390 × 2470** |
| **`ryman-reveal.stage`** | x −152, y −1313, w 6150, h 3460 | (only its floor band is needed) | 4440 px wide |
| **`ryman-reveal.curtain`** | occluder: cover only its designed area, e.g. its current x −900…800 | 710 × 1210 for the current rect | 1410 × 2410 |
| `ryman-house.upstage` | x −903, y −641, w 5350, h 2930 | 3060 × 1680 | 6110 × 3350 |
| `ryman-mic.house` | x 1061, y 660, w 1540, h 870 | 2630 × 1490 | 5260 × 2970 |
| `ryman-backstage.wall` | x −97, y −196, w 4800, h 1960 | 5080 × 2080 | 10150 × 4150 |

The backstage numbers are large because one set serves both a 937-px-frame medium shot and 1875-px-frame wides. When those shots go to final, split them into per-shot plates or paint the backstage at 1080 working resolution first.

### 2.5 File format

- **PNG**, 8-bit sRGB, **straight (unpremultiplied) alpha** for any plate with transparency (curtain, stage band, mic). Opaque backdrops may be PNG or high-quality JPEG.
- **No trimming of registered layers:** if several plates are cut from one painting, export them all at the full painting canvas so they keep registration, and give them the same rect.
- Painted light, haze and texture belong **in the plates**. The engine composites flat cards with no filters (by design). Grain, glow and grade, if needed, go in After Effects from the PNG sequence (§5.4).

---

## 3. Adding Jim's approved poses without touching the fidelity tests

### 3.1 Why the fidelity tests are unaffected

- `verify-rig.mjs` reads only `punchers/characters/little-kc/rig.json` and the master JPEG. Poses live in a **separate file**, `poses.json`, and never enter the rig.
- The rig rest-pose test, the "no stretch, shear or mirror" test, and all Episode 000 tests run unchanged. **Do not edit `rig.json`, `public/little-kc/derived/`, or the master JPEG.**

### 3.2 Where and how

```
art/source/little-kc/<date>-<description>/   ← Jim's untouched originals (PSD / Procreate exports)
public/punchers/characters/little-kc/poses/rear.png
public/punchers/characters/little-kc/poses/seated.png …
```

```jsonc
// punchers/characters/little-kc/poses.json
"rear": {
  "file": "rear.png",
  "size": [1400, 2400],          // the file's exact pixel size (required)
  "anchor": [0.5, 0.97],         // the point (fractions of the image) that stands on the staging mark: KC's feet on the ground line
  "note": "Jim, approved 2026-MM-DD. sha256 <hash of rear.png>"
}
```

- **Export 1:1 from Jim's file.** No resampling, retouching or colour conversion. Record the file's SHA-256 in `note` (`shasum -a 256 rear.png`), so anyone can confirm the committed file is the one Jim approved.
- **Model-sheet registration (strongly recommended):** ask Jim to draw every pose on the **same canvas size, at the same scale, with the same ground line**. Then every pose has the same `size` and `anchor`, and KC is the same height in every shot without per-pose tuning.
- The engine draws the pose at height `kc.h` (sheet px, set in each shot's `staging`). Width always follows the file's own aspect ratio, so the drawing can't be distorted.

### 3.3 Keeping KC's on-screen scale as approved

`kc.h` is the height of the **whole image canvas**, not of KC. The board scales assume KC himself is 300 sheet px. If KC fills a fraction `f` of his canvas height (e.g. 2200 of 2400 px → f = 0.917):

- set `kc.h = 300 / f` in each shot's `staging.defaults` (here 327);
- in `punchers/engine/engine.test.ts`, the test *"framing follows the board"* measures `kc.rect.h` (the canvas). Multiply it by the same `f` (a one-line constant). This is a **reviewed test edit** in step with an art change, not a fidelity test.

### 3.4 The one test that is designed to change

`001: nothing is drawn as the character or the venue until it is approved` is a **tripwire**. It fails the moment any real artwork appears in Episode 001, so no art arrives unnoticed. When the first approved asset lands, replace it in the same commit with a check that each sprite comes from an approved entry:

```ts
test('001: every drawn image is an approved asset', () => {
  for (const s of pmo.shots) for (const d of pmo.frameAt(s.secIn).drawables) {
    if (d.kind === 'placeholder') continue;
    assert.ok(d.file.startsWith('/punchers/') || d.file.startsWith('/little-kc/derived/'), `${s.id}: ${d.file}`);
  }
});
```

### 3.5 A pose change inside a shot (e.g. SH080 "one hand opens")

The baseline picks one pose per cast member per shot. To swap drawings *within* a shot without engine changes, add a second cast slot for the same character and switch on a frame with `hold` keys:

```jsonc
// episode.json → "cast"
"kc":  { "poses": "little-kc", "z": 20 },
"kc2": { "poses": "little-kc", "z": 20 }

// sh080.json
"cast": { "kc": { "pose": "sing" }, "kc2": { "pose": "hand-open" } },
"staging": {
  "defaults": { "kc.y": 1400, "kc.h": 300, "kc2.y": 1400, "kc2.h": 300, "kc.x": 1830, "kc2.x": 1830 },
  "keys": {
    "kc.opacity":  [{ "at": "29s", "v": 1 }, { "at": "30.5s", "v": 0, "ease": "hold" }],
    "kc2.opacity": [{ "at": "29s", "v": 0 }, { "at": "30.5s", "v": 1, "ease": "hold" }]
  }
}
```

`hold` switches exactly on the key's frame (no crossfade). Once the song's beat map exists, write the switch time in bars (`"14:3"`) so it lands on the music. A shot without a pose for `kc2` doesn't draw it. This handles a few key drawings per shot. **Full lip-sync (many mouth swaps) is a future engine milestone and is out of scope for the reveal test.**

---

## 4. Adding the *Pour Me Out* recording and synchronising gestures

### 4.1 The file

```
public/punchers/audio/pour-me-out-excerpt.wav     ← 48 kHz / 24-bit WAV (Chrome decodes it); AAC .m4a also works
```

Rights: committing the file puts the recording permanently in git history. If the repository is or may become public, keep the file local and untracked by listing it in `.git/info/exclude` (per-clone; the shared root `.gitignore` belongs to *The Arrival* and is off-limits), and commit only the JSON.

### 4.2 The JSON

```jsonc
// punchers/episodes/001-pour-me-out/episode.json
"audio": {
  "src": "/punchers/audio/pour-me-out-excerpt.wav",
  "offset": 0,           // seconds INTO THE FILE at which the cut's 0:00 falls
  "status": "approved",
  "note": "Master: <source, date>. Phrase: <bars/lyric>."
}
```

The player plays the stem on the master clock from `offset + playhead`, through seek, pause and resume (covered by the transport tests).

### 4.3 The tempo map, the step that makes gestures musical

Replace the placeholder tempo with the measured beats of the recording:

```jsonc
"tempo": {
  "kind": "beat-times",
  "beatsPerBar": 4,
  "times": [ -0.412, 0.418, 1.247, … ]   // every beat, in seconds, starting with bar 1 beat 1
}
// and delete  "placeholder": true
```

- **`times` are in episode time:** the beat's time in the recording **minus `offset`**. Bar 1 beat 1 may be negative if the cut starts mid-bar.
- One entry per beat, strictly increasing. A live, rubato performance needs every beat, not a bpm.
- How to get them: tap or warp-marker the stem in the DAW (Logic/Ableton warp markers → list of beat times), or tap layer markers on the audio layer in After Effects and copy the marker times. Have the music side sign off the beat list. It's the spine every gesture hangs on.

### 4.4 Placing gestures on the music

- **Cuts stay in seconds.** The ten durations (4/3/4/3/5/5/5/4/3/6) are approved in seconds, and seconds positions (`"24s"`) don't move when the tempo changes. Re-time cuts only with editorial approval, inside the 30–45 s envelope.
- **Gestures go in musical positions**, so they ride the performance:
  - name the moments once, in `episode.json` → `markers`: `"breath": "13:4.5"`, `"firstWord": "14:1"`, `"handOpen": "15:3"`;
  - key against them: `{ "at": "@firstWord-1beat", … }`, `{ "at": "@handOpen", "v": 1, "ease": "hold" }`.
- Breath and sway (`layers` of type `osc`) are counted in beats (`periodBeats`), so they follow the singer's tempo automatically. Keep amplitudes small.

### 4.5 Checking sync

1. Player, **click on**: the click must sit exactly on the stem's beats. If it doesn't, the beat list or `offset` is wrong, not the engine.
2. Scrub to each marker with ←/→ (one frame) and confirm the gesture frame against the waveform.
3. Export (`render-frames.mjs`) and lay the PNG sequence over the stem in After Effects. `frames.json` gives the timecode, shot and bar:beat for every frame.

---

## 5. Integrating Astra's work safely

### 5.1 Branching

```bash
git switch -c astra/ryman-reveal 10aa19e
```

- Work only on `astra/ryman-reveal`. Never commit to `main`, `the-arrival` or `claude/punchers-production-system` directly.
- Hand back by pull request **into `claude/punchers-production-system`** (not `main`), reviewed before merge. No force-pushes. Nothing is deployed.

### 5.2 What Astra may and may not touch

| Allowed (art + data) | Off-limits (verified baseline and *The Arrival*) |
|---|---|
| `public/punchers/**` (new art and audio files) | `punchers/engine/**`, `punchers/proof/**`, `punchers/scripts/**`, `punchers/vite.config.ts`, `punchers/tsconfig.json` |
| `art/source/**` (originals) | `punchers/characters/little-kc/rig.json` |
| `punchers/environments/ryman-*/environment.json` | `public/little-kc/**`, `bea8729f-ce73-440b-804f-88e87d98273d.jpeg` |
| `punchers/characters/little-kc/poses.json` | `src/**`, `index.html`, `scripts/**`, `docs/**` (*The Arrival*) |
| `punchers/episodes/001-pour-me-out/**` (shots, episode.json, review/) | `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json` (root) |
| `engine.test.ts`: only the two art-driven edits in §3.3–3.4 | `punchers/episodes/000-proof/**`, `punchers/environments/jims-sheet/**` |

Check any branch before review:

```bash
git diff --name-only 10aa19e...astra/ryman-reveal | grep -vE '^(public/punchers/|art/source/|punchers/environments/ryman-|punchers/characters/little-kc/poses\.json|punchers/episodes/001-pour-me-out/|punchers/engine/engine\.test\.ts$)'
```

**Any output means a file outside the art/data boundary changed.** That PR is held until reviewed. If the work genuinely needs an engine change, it comes back as a separate, explicit engineering request, not inside an art PR.

### 5.3 The gate: every PR must pass all of it

```bash
npm test                                         # The Arrival: 6/6 + 173,670 stroke pixels = master
npm run build                                    # The Arrival builds
npx tsc -p punchers                              # strict types
node --test "punchers/**/*.test.ts"              # 32/32 at baseline
node punchers/scripts/verify-rig.mjs             # Jim's master: bit-exact, 0 pixels missing
node punchers/scripts/render-frames.mjs --episode 001-pour-me-out --contact   # no page errors; regenerates review sheets
node punchers/scripts/render-frames.mjs --episode 000-proof --contact         # Episode 000 still renders
```

Baseline results at `10aa19e` are recorded in `punchers/README.md`. A PR that changes any of these numbers for Episode 000 or *The Arrival* is wrong by definition.

### 5.4 Reviewing the reveal

- Live: `npx vite --config punchers/vite.config.ts` → http://localhost:5180/?ep=001-pour-me-out&t=14 (click **SH050** on the timeline; ←/→ steps frames).
- Frames: after the render command, SH050 is `.scratch/punchers/001-pour-me-out/frames/00336.png` … `00455.png` (local, not committed). `review/shots.jpg` shows its first, middle and last frame.
- Finishing (optional): import that PNG sequence into After Effects at 24 fps for haze, grain and grade. Keep the comp's frame numbers matched to `frames.json`.

---

## Open dependencies (unchanged from baseline)

1. **Verified Ryman reference package** and the approved paintings for `ryman-reveal` (house, stage, curtain), then the other three sets.
2. **Jim's `rear` drawing** (for SH050), then seated, stand, walk keys, sing, hand-open, release, at ≥ 1250 px character height for 2160p close-ups.
3. **The recording**, the chosen excerpt (`offset`), and its signed-off beat list.
4. Blender (venue layout) is not installed. After Effects and Media Encoder are.
