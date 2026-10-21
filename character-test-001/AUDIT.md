# PUNCHERS — Character Test 001

18 October 2026. Branch: `character-test/001-little-kc`. Separate worktree based on `f3df562`. No Arrival edits, merge, deployment or external publication.

## Result and limits

`little-kc-limited-motion.webm` is a ten-second, 24 fps **limited source-art head movement study**, not the completed requested performance. `index.html` supplies playback, scrubbing, and original comparison. The head tilts rhythmically, lifts a fraction, then settles. The final four seconds hold the original pose. Persistent video captions disclose each unsupported action. There is no temporary character stand-in and no simulated walking by sliding the seated figure offscreen.

This motion treatment is proposed for Cole's review, not artist-approved animation. Cole's provided drawing is the authoritative visual reference. Its eyes, mouth, afro, clothing, boots, stool and guitar have not been redrawn. The drawing already has a slight smile; no new expression is claimed.

## Artwork audit

- User attachment `/Users/colecalfee/Desktop/123 1.png`: successfully opened; 336 × 336 flattened PNG. Red textured ink, warm cream paper, seated KC, guitar, boots, stool, closed eyes. No separate anatomy layers or alternate poses delivered.
- Exact untouched copy: `source/jim-seated-kc.png`. Both SHA-256: `38e55745d55051255d97451231af2ed8df2273d568e8addc98b487f5cd4fae56`.
- Existing repository JPEG `bea8729f-ce73-440b-804f-88e87d98273d.jpeg`: visually inspected; 1523 × 1536 floating KC with balloons and hat. Different drawing; excluded from this test.
- Existing derived figure is one rigid floating cutout. Existing pose registry marks seated, standing and walking art missing. This new seated attachment supersedes that finding for this test only; shared episode data was not changed.
- Project `sources/` is empty. Previous local diagnosis reports truncated web derivatives; they are not used or treated as masters.
- 336 px is sufficient for a small motion proof, not detailed production delivery. Output doubles its display size without claiming recovered detail. Request original-resolution source for final production.

## Tool audit and choice

- Existing PUNCHERS TypeScript rig supports rigid part transforms and drawing swaps. It has no approved standing/walk drawings. Its pipeline excludes mesh warping and invented hidden anatomy.
- Local browser Canvas supports deterministic time sampling, compositing, original comparison and scrubbing. Chosen for this isolated proof; no production engine modifications required.
- Local Playwright/Chromium and bundled FFmpeg provide frame capture and WebM export. Export is 240 frames at 24 fps, no audio.
- Adobe After Effects 2026, Render Engine/aerender and Media Encoder 2026 are installed. Installation was observed; licensing and rendering were not tested. Suitable for a later layered cutout or replacement-drawing project, but do not supply missing drawings.
- Figma timeline/export and Weave model/workflow tools are exposed in the session. No remote workflow was run and no assets uploaded. Generative pose/video interpolation is excluded here because it would invent unapproved eyes, joints and gait.

## How the limited animation works

A polygon isolates the head and a margin of its original paper. The head is moved as a rigid raster tile, with a neck pivot at source coordinate (169,151). Maximum lift is 0.65 source pixels; maximum rotation is 0.8 degrees. No nonuniform scaling, mesh deformation, recoloring, synthetic texture or new strokes.

To prevent a duplicate head beneath the tile, the vacated region uses actual blank paper sampled one-to-one from 112 pixels to its right in the same image. That small paper patch is a technical compositing accommodation, not pristine original registration; Cole should review its edge and neck join. No hidden character anatomy is reconstructed. At time zero and from 5.5 seconds onward, the renderer draws the unmodified original. Original-comparison mode always shows the unmodified original.

Hands overlap the guitar. Moving either from this flattened image would expose missing strings/body/hand contours. They stay fixed. The seated silhouette cannot establish how legs unfold or boots plant, so no stand, hop or gait is manufactured.

## Required drawings / approval

| Time | Requested performance | Actual study | Needed from Cole |
|---|---|---|---|
| 0–2s | Gentle strumming | Tiny head rhythm only | Separate strumming forearm/hand and clean guitar beneath; approved up/down strum positions and wrist overlap |
| 2–4s | Raise head, open eyes, knowing smile | Small rigid tilt/lift; original closed eyes and mouth | Head-up drawing, open-eye and smile variants, neck overlap; approve restrained motion treatment |
| 4–6s | Stop, adjust guitar, prepare to stand | Head settles only | Resting hand, guitar carry/adjust pose, forward weight shift and planted-foot preparation |
| 6–8s | Hop off stool, boots land | Explicit original-pose hold | Push-off, brief descent, boot-contact and settled-standing drawings; clean stool behind figure; guitar/arm overlaps |
| 8–10s | Natural steps, exit frame | Explicit original-pose hold | Both-foot contact and passing poses, weight/down/up transitions as needed, exit-facing view with guitar; approve stride and timing |

Please supply a layered PSD/Procreate master or registered full-canvas transparent PNG layers, plus a flattened reference. Include the original cream paper independently and complete overlapping parts. Cole can draw or approve the additional poses before final animation. Keep camera locked, stool grounded, body scale constant, and use a modest weight transfer without squash-and-stretch.

## Review gate

Before calling this complete: compare rest pose with the master, inspect the moving neck/paper seam at native resolution, secure Cole's pose/motion approval, then animate and review all five requested beats. Current validation covers playback/export, not completion of the missing performance.
