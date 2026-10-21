# KC / Consolidation 001: recovery inventory

21 October 2026. Branch `consolidation-001` (local only, not pushed). Worktree: `~/Sites/kc-consolidation-001`.

GitHub: `colemanvii/kc` is **public**. The local remote URL still says `colemanvii/animation.git`; GitHub redirects it to `kc`.

## 1. Sources found

| Source | Kind | What it held that nothing else did |
|---|---|---|
| `~/Sites/kc` (branch `motion-test-001`) | Main checkout | Uncommitted `character-dev/004/`, `film/pour-me-out/`, `.gitignore`, README attribution fix. Local-only branch `claude/punchers-production-system` (2 commits). |
| `~/Documents/ChatGPT/Kash/kc` (branch `codex/bitmap-source-audit`) | Codex clone | 3 local-only commits: `recovery/`, `bitmap-preview/`, `studies/seated-beat-001/`. Uncommitted `studies/seated-beat-001/player/`. |
| `~/.codex/.chatgpt-projects/g-p-6a89f8e42a0081919f32ede6c6215ce6/punchers-sh050` (branch `astra/ryman-reveal`) | Codex clone | 1 local-only commit: SH050 coverage review and Ryman reveal notes. |
| `…/g-p-6a89f8e42…/little-kc-test-001` (branch `character-test/001-little-kc`) | Worktree of the above | 1 local-only commit: `character-test-001/` head-motion study and audit. |
| `…/g-p-6a89f8e42…/pour-me-out-previs/` | Not in git | 42 s ten-shot timing animatic (webm), stage-reveal test, shot frames. |
| `…/g-p-6a89f8e42…/pour-me-out-production/` | Not in git | Asset intake diagnosis and reveal scene. |
| `~/.codex/generated_images/01a15aa5-83a0-7be0-a59d-03bd2fe649cc/` | Codex output | 5 PNGs: 2 match the seated-beat candidates; 3 unused. |
| `~/Documents/ChatGPT/Kash/KC-WORLD-001-TEN-YEAR-STRATEGY.md` | Strategy doc | The only place KC-97FM appears. |
| `~/Desktop/KC/` | Loose files | Originals as delivered in chat, Kash photos, ChatGPT boards. |
| `~/Downloads/KC_Act1SummerNights_Artwork.psd` | Layered PSD | *Act I: Summer Nights* artwork. It is not a layered Little KC drawing. |

Other Kashus files exist but are outside this repo's scope: the PSDs in `~/Downloads` (Pour Me Out, After Me, tee design, the Summer versions), the `~/Downloads/KC RUFF.zip` rough mixes, and the business PDFs and spreadsheets. Portfolio copies live in `~/Sites/personal-reliability` and `~/Sites/colecalfee-personal`. In `~/Desktop/Archive/…` the Kashus, Punchers and Pour Me Out folders are iCloud placeholders that have not been downloaded, so their contents are unverified.

## 2. What is on GitHub vs local only

| Work | GitHub `main` | GitHub `the-arrival` | Only local (now in `consolidation-001`) |
|---|---|---|---|
| The Arrival: app, tests, derived layers, captures, docs | – | ✓ | |
| Master drawing `bea8729f-…jpeg` | – | ✓ | |
| README "Animation / Work in progress" rewrite | ✓ (2 commits) | – | |
| PUNCHERS engine, proof player, episodes 000/001 | – | – | ✓ |
| SH050 coverage, Ryman reveal notes | – | – | ✓ |
| character-test-001 head motion | – | – | ✓ |
| Bitmap recovery audit, bitmap preview | – | – | ✓ |
| seated-beat-001: breath and strum candidates, player | – | – | ✓ (the player was never committed anywhere) |
| character-dev/004: original art, 07 explorations, expressions, key-pose handoff | – | – | ✓ (never committed anywhere) |
| Pour Me Out board, SH010 | – | – | ✓ (never committed anywhere) |
| Pour Me Out Codex previs and animatic | – | – | ✓ (never in git) |
| Kash photos, AI dev board (`references/private/`) | – | – | Local only, **gitignored on purpose** |

`main` and `the-arrival` split at `e984d3d`. `main` has 2 README-only commits and `the-arrival` has 3 commits with all the code. Merging them conflicts only in `README.md`. This branch keeps the-arrival's README.

## 3. Missing or incomplete

- **Walk-in, sit-down and singing motion tests: not found anywhere.** Key poses 01a, 01b, 02, 03, 04 and 06 (`character-dev/004/key-pose-study-001/HANDOFF.md`) were never generated. What exists: Motion Test 001 (early, archived: seated neutral → singing), seated-beat-001 (breath and strum candidates), and character-test-001 (head tilt only).
- **KC-97FM prototype: not found.** The strategy doc itself says no prototype was located.
- **Pour Me Out audio: not found.** `KC RUFF.zip` has no Pour Me Out track. Song timings are unconfirmed.
- **Layered Little KC source (PSD/Procreate): none.** Every original is a flattened JPEG or PNG.
- The full uncropped ChatGPT board for 07 and the prompts behind it.
- Ryman references, scenery, and the stool, mic and curtain art. SH010 `boards/` is empty.
- Folders that older sessions mention, `character-dev/004/motion-test-001` and `references/jim`, no longer exist. Their content survives under `explorations/archive/` and `original-art/`.
- `~/Sites/personal…/assets/kashus-character.webp` will not decode.
- The ChatGPT sandbox HTML files are not on this Mac, as expected.

## 4. Attribution

All original Little KC drawings are Cole Calfee's. This branch corrects "Jim" to Cole in docs, comments, test titles and JSON notes. Left unchanged: identifiers (`environments/jims-sheet`), the filename `character-test-001/source/jim-seated-kc.png` (byte-identical to `original-art/02-seated-guitar.png`), and the verbatim archives under `film/pour-me-out/archive/`, which carry a note instead.

## 5. Proposed organization (phase 2, needs approval)

Phase 1, this branch, is lossless: everything stays at its original path. Phase 2 moves files once you approve:

```
kc/
├── art/
│   ├── original/little-kc/       Cole's drawings + PROVENANCE.md (from character-dev/004/references/original-art, root master jpeg)
│   └── references/private/       gitignored (photos, AI dev boards)
├── character-dev/004/            studies, 07 explorations, expression sheets, key-pose handoff (as is)
├── experiences/
│   └── the-arrival/              src/, public/, index.html, vite config (now at the repo root)
├── production/punchers/          engine, proof player, environments, episodes (now punchers/ + root PUNCHERS_*.md)
├── film/pour-me-out/             board, shots, archive/ (Codex previs), audio/ (gitignored)
├── studies/                      seated-beat-001, character-test-001, bitmap-preview
└── docs/
    ├── recovery/                 recovery/ + this file
    └── strategy/                 KC-WORLD-001 (only if approved for a public repo)
```

Moving The Arrival and PUNCHERS means updating `vite.config.ts`, `punchers/vite.config.ts`, `scripts/*.mjs`, `manifest.json` `source`, and the relative `ART` path in the board. Do it as one commit, with the tests and a browser check after it.

## 6. Validation (this branch)

- The Arrival: `npm test` 6/6 pass, layer fidelity 0 pixels differ, `npm run build` OK. Renders at rest in the browser with no console errors.
- PUNCHERS: 32/32 tests pass, `verify-rig` OK, `tsc` OK. The proof player loads with no errors.
- All 9 static pages load with 0 broken images and 0 HTTP errors: the board, previs, production, seated-beat player, both bitmap previews, character-test-001, Motion Test 001 and SH050 blockout.
- The 6 ChatGPT 07 files match the SHA-256 prefixes in PROVENANCE. The balloon original is byte-identical to the repo master and the Desktop copy. Copied folders were checked byte-for-byte with `diff -r`.

## 7. Backups

`~/Sites/_kc-recovery/2026-10-21/` (`SHA256SUMS` inside):

- `kc-all-refs.bundle`, `documents-chatgpt-kash-kc.bundle`, `punchers-sh050.bundle`: full git history of every checkout (verified)
- `kc-working-tree-full.tgz`: `~/Sites/kc` including uncommitted and private files, excluding `node_modules`
- `other-locations/`: Codex previs and production, the generated images, the seated-beat player, `Desktop/KC`, the strategy doc, the Summer Nights PSD
- `*.status.txt`, `*.branches.txt`, `uncommitted-README.patch`, `file-manifest.sha256`

The local-only branches are also kept in `~/Sites/kc` as `recovered/*`.
