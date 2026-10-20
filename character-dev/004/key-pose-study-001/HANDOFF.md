# Little KC — Key Pose Study 001: Production Handoff

**Sequence:** KC walks in, approaches the stool, turns, sits, settles with the guitar, breathes, and sings.
**Goal:** the minimum drawings for a convincing rough animatic. These are key poses, not finished animation.
**Anchors:** `explorations/chatgpt/07-soulful-artist-crop.webp` (standing) and `07-seated-01-neutral.webp` (seated). Attach both to every generation request.

---

## Staging decisions (lock these before generating anything)

These make the poses fit together. If the drawings disagree on them, the animatic falls apart.

1. **One locked camera.** All poses are full-body, at the same scale, with the same ground line and the same stool position. The camera never cuts. Any push-in for the singing happens later by cropping, not with new art.
2. **Screen direction.** KC enters from **frame left** and walks right toward the stool in the center. That way he ends up three-quarters to the right, matching the seated drawings with the guitar neck pointing right.
3. **The guitar comes in with him.** He carries it by the neck in his left hand (the hand farther from the camera), with the body hanging down beside his leg. The stool stands empty in frame from the start.
4. **Same stool in every pose:** the wooden four-legged stool from the seated drawings.
5. **Same canvas:** 1254×1254, plain cream background (#FDF4E2), no text, no shadow besides the soft floor shadow already in the seated art.

## Consistency checklist (applies to every pose)

- **Proportions:** chibi build. The head and hair take up roughly 45% of his standing height. Short legs, small hands.
- **Hair:** a large rounded afro with chunky pixel curl clusters in dark brown and black. Same silhouette volume from every angle.
- **Face:** the same large eyes (white with dark brown pupils), small rounded nose, soft blush on the cheeks, thin mustache, goatee and short chin beard.
- **Skin tone:** the same warm brown as 07.
- **Outfit:** black tank top, thin silver chain with a square pendant, dark baggy jeans cuffed at the ankle, black-and-white sneakers.
- **Guitar:** the same natural-wood acoustic with a dark pickguard and brown headstock with six tuners.
- **Look:** the same pixel-styled bitmap rendering, dark outline weight and palette. Not smoother and not lower resolution.

---

## The 7 key poses

| # | Pose | Framing | Artwork status |
|---|---|---|---|
| 01 | Entrance walk | Full body | **New: 2 drawings** (01a contact, 01b passing) |
| 02 | Approach / slow down | Full body | **New** |
| 03 | Turn toward stool | Full body | **New** |
| 04 | Sit / settle | Full body | **New** |
| 05 | Seated, ready with guitar | Full body | **Exists:** `07-seated-01-neutral.webp` |
| 06 | Inhale / breath | Full body | **New: face-and-shoulders edit of 05** |
| 07 | Singing | Full body (crop later for a push-in) | **Exists:** `07-seated-03-singing.webp` |

**Total new drawings: 6** (01a, 01b, 02, 03, 04, 06).

### 01 — Entrance walk
- **Communicates:** an easy, unhurried, slightly cool stroll. He's arriving to play, not rushing.
- **Framing:** full body, three-quarter view facing right, entering from frame left.
- **Needs:** **two drawings.** A single walking drawing slid across the screen reads as a paper cutout. Two drawings alternated make a real walk.
  - **01a, contact:** heels down, legs at their widest stride, body at its lowest point.
  - **01b, passing:** one leg straight under him, the other knee lifting past it, body at its highest point. The hair lifts slightly.
  - In both, the guitar hangs by the neck from his left hand, with a relaxed swing on the free arm.
- **Highest risk:** this is the first time the character is seen walking and turned more to the side. Generate and approve 01a before anything else, because it sets the look for the rest.

### 02 — Approach / slow down
- **Communicates:** he sees the stool and eases off. His weight settles back, and there's a hint of the dreamy upward look from 07.
- **Framing:** full body, three-quarter view facing right, a few steps from the stool.
- **Needs:** a new drawing. Shorter stride than 01, body upright, the guitar swinging a little forward from the deceleration.

### 03 — Turn toward stool
- **Communicates:** a deliberate pivot. He's choosing his spot.
- **Framing:** full body, beside the stool, body turned three-quarters toward the camera, head leading the turn.
- **Needs:** a new drawing. Feet planted mid-pivot. The guitar is coming up in front of him, both hands moving to hold it ready.

### 04 — Sit / settle
- **Communicates:** the weight dropping onto the stool. A small exhale, comfortable and at home.
- **Framing:** full body, the same position and angle as 05, so it cuts straight into 05.
- **Needs:** a new drawing. Hips just landing on the stool, knees bending, the guitar held across his lap but not yet in playing position, eyes lowered to the guitar.

### 05 — Seated, ready with guitar
- **Communicates:** set, calm, looking up thoughtfully. The moment before the music.
- **Framing:** full body.
- **Artwork:** **exists** (`07-seated-01-neutral.webp`). This is the anchor for 04, 06 and 07.

### 06 — Inhale / breath
- **Communicates:** gathering himself. The emotional turn, where the song starts inside him.
- **Framing:** full body, identical to 05.
- **Needs:** **a face-and-shoulders edit of 05**, not a new drawing. Eyes gently closed, mouth closed, chin lifting slightly, shoulders raised a touch. Draw the face in the **singing drawing's face position** (the features sit lower in `07-seated-03-singing`). Then the eyes close first, and only the mouth has to open going into 07.

### 07 — Singing
- **Communicates:** singing his little heart out. Soulful, sincere, not goofy.
- **Framing:** full body. A slow push-in toward a medium shot can be done later by cropping, with no new art.
- **Artwork:** **exists** (`07-seated-03-singing.webp`). The optional softer-brow / less-nose-shading revision from Expression Study 001 still applies.

---

## Generation order

1. **01a** → approve before going further. It sets the walking look.
2. **01b**, matched to 01a.
3. **04**, generated from 05 so the sit lines up with the seated art.
4. **06**, as a face-and-shoulders edit of 05.
5. **03**, then **02**, to fill the gap between the walk and the sit.

**Base instruction** to put before each pose description in ChatGPT:

> Using this exact character (Little KC, 07 Soulful Artist) and the attached seated drawing as references: same proportions, afro silhouette and texture, skin tone, mustache, goatee and chin beard, black tank top, silver chain with square pendant, dark cuffed baggy jeans, black-and-white sneakers, same acoustic guitar and wooden stool, same pixel-styled bitmap rendering and outline weight. Full body, 1254×1254, plain cream background, the same camera distance and ground line as the seated drawing, no text. Pose: …

**Delivery:** save each one to `explorations/chatgpt/` as `07-key-01a-walk-contact.webp`, `07-key-01b-walk-passing.webp`, `07-key-02-approach.webp`, `07-key-03-turn.webp`, `07-key-04-sit.webp` and `07-key-06-inhale.webp`. As drawings arrive, Claude checks each against the anchors for scale, ground line and design drift, then lays all 7 out as one key-pose sheet for approval.
