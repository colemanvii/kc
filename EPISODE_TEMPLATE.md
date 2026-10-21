# PUNCHERS — Episode Template

Every episode is a folder of JSON that the engine compiles, the player previews and the exporter renders. Worked examples: `punchers/episodes/000-proof/` (Cole's real art, music-timed) and `punchers/episodes/001-pour-me-out/` (the approved ten-shot board, assets pending).

## Folder

```
punchers/episodes/<NNN-slug>/
  episode.json        meta, delivery, audio, tempo, markers, cast, continuous performance
  shots/sh010.json …  one file per shot, in cut order (listed in episode.json)
  source/             provenance: approved boards, scripts, notes (read-only)
  review/             committed review sheets (shots.jpg, contact-sheet.jpg)
punchers/characters/<name>/rig.json | poses.json      shared across episodes
punchers/environments/<name>/environment.json         shared across episodes
public/punchers/…                                     approved image and audio files
.scratch/punchers/<episode>/frames/                   rendered PNG sequences (not committed)
```

## episode.json

```jsonc
{
  "id": "001-pour-me-out",
  "title": "Pour Me Out",
  "delivery": { "width": 1280, "height": 720, "fps": 24, "sensorHeightMm": 14 },
  "audio": { "src": null, "offset": 0, "status": "missing", "note": "…" },
  "tempo": { "kind": "segments", "placeholder": true, "beatsPerBar": 4, "downbeat": 0,
             "segments": [{ "bar": 1, "bpm": 60 }], "bars": 11 },
  "markers": { "vocal": "24s", "release": "36s" },
  "environment": "ryman-backstage",
  "cast": { "kc": { "poses": "little-kc", "z": 20 } },
  "performance": { "keys": {}, "layers": [] },
  "shots": ["sh010", "sh020", "…"]
}
```

- **tempo**: `segments` (constant bpm spans) for placeholders and clicked takes; `beat-times` (measured timestamp of every beat) for a live performance. Set `placeholder: true` until it comes from the real recording: the player then marks bar numbers with `~`.
- **audio.offset**: seconds into the recording where this cut's 0:00 falls (an excerpt can start mid-song).
- **cast**: `rig` (cut-out rig of a master) or `poses` (pose library for drawing swaps), plus depth `z`.
- **performance**: channels that belong to the *scene* and run through cuts.

## shots/shNNN.json

```jsonc
{
  "id": "SH050",
  "title": "Ryman reveal",
  "note": "Hold Little KC small. Let the room open in layers. Camera: Slow forward creep past curtain.",
  "in": "14s", "out": "19s",                      // or "5:1", "@chorus", "@chorus+2bars"
  "environment": "ryman-reveal",                  // per set-up; defaults to the episode's
  "lensMm": 28,                                   // Super 35 16:9 gate → vertical FOV
  "camera": { "keys": {
      "camera.x":     [{ "at": "14s", "v": 2922.2 }, { "at": "19s", "v": 3012.2, "ease": "inOutSine" }],
      "camera.y":     [{ "at": "14s", "v": 416.7 }],
      "camera.frame": [{ "at": "14s", "v": 3333 }, { "at": "19s", "v": 2867, "ease": "inOutSine" }],
      "picture.fade": []                          // optional 0→1 to black
  } },
  "staging": { "defaults": { "kc.y": 1300, "kc.h": 300 }, "keys": { "kc.x": [{ "at": "14s", "v": 1500 }] } },
  "cast": { "kc": { "pose": "rear" } },
  "missing": ["Cole's rear pose", "verified Ryman layout", "painted room"]
}
```

- Shots must tile the cut exactly: no gaps or overlaps (compile error).
- `camera.frame` is how much of the set (sheet px, vertically) fills the frame. Changing it is a **dolly**, so nearer planes grow faster than far ones: real multiplane parallax.
- Keys: `{ at, v, ease }`, where ease is one of `linear hold inSine outSine inOutSine inQuad outQuad inOutQuad outCubic inOutCubic smootherstep` and describes the segment arriving at that key.
- Performance layers (`layers`): `{ "type": "osc", "channel", "amp", "periodBeats", "phaseBeats", "from", "to", "fadeBeats" }`. These are beat-locked, so breath and sway follow the singer's tempo, not the wall clock. Keep them small; restraint is the house style.

## environment.json

```jsonc
{ "id": "ryman-mic", "status": "blockout", "assetBase": "/punchers/environments/ryman-mic/",
  "ground": [30, 28, 26],
  "planes": [
    { "id": "house", "kind": "slot", "z": -700, "rect": { "x": 600, "y": 300, "w": 2400, "h": 1500 },
      "label": "The house beyond the lights (missing)", "file": null },
    { "id": "mic", "kind": "slot", "z": 40, "rect": { … }, "label": "Microphone (missing)", "file": null }
  ] }
```
Plane kinds: `tile` (endless texture), `sprite` (a cut at its master rectangle), `slot` (a painting to come).

## Swapping in approved assets (no code changes)

| Asset arrives | Do this | Then |
|---|---|---|
| **A pose drawing** (e.g. KC seated) | Put the PNG in `public/punchers/characters/little-kc/poses/seated.png`. In `poses.json` set `"seated": { "file": "seated.png", "size": [W, H], "anchor": [ax, ay] }` | Every shot using `seated` draws it at its own proportions, anchored on its staging mark |
| **A Ryman painting** (e.g. the curtain leg) | Put it in `public/punchers/environments/ryman-reveal/curtain.png`. On that plane set `"file": "curtain.png", "size": [W, H]` | It fills the slot's rect (fit inside, centred, never stretched). Adjust `rect`/`z` to the verified layout |
| **The song** | Put it in `public/punchers/audio/pour-me-out.wav`. Set `"audio": { "src": "/punchers/audio/pour-me-out.wav", "offset": <song time of 0:00>, "status": "approved" }` | The player plays it on the master clock. The click stays available |
| **The real tempo** | Replace `tempo` with `{ "kind": "beat-times", "beatsPerBar": 4, "times": [ … ] }` (tapped or detected from the stem), remove `placeholder` | Positions written in bars re-time automatically. Positions written in seconds (`"24s"`) stay put: convert them to bars once the phrase is chosen |

After any swap: `node --test "punchers/**/*.test.ts"`, `verify-rig.mjs` for rigs, then re-render the review sheets.

## Exports

| Output | Command | Use |
|---|---|---|
| PNG sequence + `frames.json` (frame, timecode, shot, bar:beat) | `node punchers/scripts/render-frames.mjs --episode <id>` | Import to After Effects as a PNG sequence at the episode fps; conform against the stem |
| Review sheets | `… --contact` | `review/shots.jpg` (in/mid/last of every shot), `review/contact-sheet.jpg` (1 frame/s) |
| Master (next step) | After Effects comp → Media Encoder: ProRes 4444 master, H.264 review | Grade, light, grain in comp |
