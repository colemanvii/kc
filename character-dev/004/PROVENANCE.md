# Character Development 004 — Provenance

Every reference and exploration used in CD-004, ranked by authority. When sources disagree, the higher tier wins.

## Tier 1 — Original Little KC artwork (primary source of truth)

**Artist: Cole Calfee** (creator of Little KC; creative director and sole artist on this project).
Earlier project documents attributed these drawings to "Jim". That was an error; all four drawings are Cole's.

Location: `references/original-art/` (committable; unmodified copies)

| File | Subject | Size | Obtained from |
|---|---|---|---|
| `01-floating-balloons.jpeg` | KC floating under devil and angel balloons, hat in hand | 1523×1536 | Repo master `bea8729f-…jpeg` (branch `the-arrival`), byte-identical |
| `02-seated-guitar.png` | KC on a stool with a guitar, red stamp style | 336×336 | Supplied by Cole in chat, 2026-10-20 |
| `03-bama-cowboy-pony.jpg` | KC on a pony firing two cap guns, "Just a boy from Bama, makin' his way" | 1693×1693 | Supplied by Cole in chat, 2026-10-20 |
| `04-summer-nights-boombox.jpg` | KC holding up a boombox, "Act I: Summer Nights" | 2000×2000 | Supplied by Cole in chat, 2026-10-20 |

Known layered source, not copied: `~/Downloads/KC_Act1SummerNights_Artwork.psd` (16.3 MB; identical size to `~/Downloads/Kash/PSD.psd`).

**Design DNA to preserve:** oversized hair, expressive eyes, exaggerated proportions, humor, innocence, graphic simplicity.

## Tier 2 — Photographs of Kashus Culpepper (resemblance and contemporary identity)

Location: `references/private/kash-photos/` (**gitignored, never commit**)

| File | Notes |
|---|---|
| `01-sage-shirt-car.jpg` | Sage camp shirt, chain, leaning on a car. Clear frontal face. |
| `02-guitar-rust-shirt.webp` | Rust open shirt over a black tee, acoustic guitar, three-quarter face |
| `03-spin-black-tank.jpg` | SPIN cover: black tank, pendant chain, seated |
| `04-live-bandana.jpg` | Live on stage: bandana headband, cream shirt, smiling |
| `05-vinyl-camo-hoodie.jpg` | Camo hoodie holding the Act I vinyl, big smile |
| `06-singing-headphones.jpg` | Cream hoodie, headphones, singing with eyes closed |

Source: Cole's Desktop, matching the images Cole attached in chat on 2026-10-20. Photographer credits are unknown.

## Tier 3 — AI-generated explorations (secondary; never canonical)

Location: `references/private/dev-boards/` (gitignored until Cole decides otherwise)

| File | Notes |
|---|---|
| `dev-003-kash-inspired.png` | "Character Development 003" board, 1448×1086. Generated concept imagery. Direction only, not production art. |

Location: `explorations/chatgpt/` (committable; contains no photographs)

| File | Notes |
|---|---|
| `07-soulful-artist-crop.webp` | **AI-generated concept (ChatGPT), not original artwork.** Candidate "7. Soulful Artist", cropped from a larger ChatGPT board (neighbouring labels "…sh Resemblance" and "4. Softened Cute" are visible). 666×710. Supplied by Cole in chat, 2026-10-20. SHA-256 `f2b2c713…288aaa`. Prompt and attached references not yet recorded; the full uncropped board is not on file. **Active visual reference for Little KC (selected by Cole). Kept exactly as supplied: do not redraw, downsample or modify.** |

| `07-expression-02-smile.webp` | **AI-generated (ChatGPT) expression edit of 07: smile.** 1254×1254. Supplied by Cole in chat, 2026-10-20. SHA-256 `7803ff2a…a943`. Kept exactly as supplied. Aligned against 07 (scale ≈1.765), only the mouth region differs; the rest matches to within resampling. |
| `07-expression-03-singing.webp` | **AI-generated (ChatGPT) expression edit of 07: singing.** 1254×1254. Supplied by Cole in chat, 2026-10-20. SHA-256 `917e04aa…195d`. Kept exactly as supplied. Eyes, brows, nose and mouth differ from 07. The body and hair match apart from a ~1% horizontal stretch. |

| `07-seated-01-neutral.webp` | **AI-generated (ChatGPT) seated performance, neutral.** 1254×1254. Supplied by Cole in chat, 2026-10-20. SHA-256 `9415135f…e1b6`. Kept exactly as supplied. Base plate for Motion Test 001. |
| `07-seated-02-smile.webp` | **AI-generated (ChatGPT) seated performance, smile.** SHA-256 `639862b9…7a97`. Registered to seated neutral at (0,0); only the mouth differs. |
| `07-seated-03-singing.webp` | **AI-generated (ChatGPT) seated performance, singing.** SHA-256 `8f28decb…b30d`. Registered to seated neutral at (0,0); only the face differs. The facial features sit lower than in neutral, so its parts cannot be mixed with neutral's. |

Motion Test 001 animated seated neutral → seated singing in the browser and added no new pixels. **Archived 2026-10-20 as an early experiment** (`explorations/archive/2026-10-20-motion-test-001-early/`). Verdict (Cole): too limited, he barely moves. The direction moved to a full performance sequence; see `key-pose-study-001/HANDOFF.md`.

Expression Study 001 sheet: `explorations/expression-study-001/expression-study-001.png`. It is assembled from the three files above (crop and scale only, no repainting); the source files are unchanged.

Image facts: the pixels do not sit on one grid. Outline and hair steps are about 7 source px, while the eyes, brows, mustache and mouth use smaller, uneven cells. So it is pixel-styled concept art, not production pixel art.

## Archive: unsuccessful experiments (do not use as reference)

`explorations/archive/2026-10-20-96px-cleanup-unsuccessful/`

**Verdict (Cole, 2026-10-20): a regression. The original 07 is significantly better.** Converting 07 to a smaller pixel grid lost fidelity, expression and personality, and that direction is closed. Fidelity, expression and personality take priority over sprite-resolution limits. Archived as a record only. The scripts' relative paths broke when the files were moved, and they are not maintained.

| File | What it was |
|---|---|
| `studies/01-sprite-height-test*.png` | Automated downsample of 07 at 64/80/96 px tall (Mitchell filter, 24 colours). |
| `cleanup/` (`base.mjs`, `fix.mjs`, `palette.json`, `*-96.txt`, `sprite-96.png`, `sheet.mjs`, `render.mjs`) | Claude's 57×96 pixel translation of 07: an automated underlay plus hand corrections. |
| `02-soulful-artist-96px-cleanup.png` | The review sheet comparing that translation with 07. |
