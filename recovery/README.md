# Little KC recovery checkpoint — 20 October 2026

## Working copy and preservation

Work for this recovery lives in `/Users/colecalfee/Documents/ChatGPT/Kash/kc`,
on local branch `codex/bitmap-source-audit`, based on `4e1e011`.
Nothing has been pushed, merged, or deployed.

The original local checkout is `/Users/colecalfee/Sites/kc`. It remains on
`motion-test-001`, with its modified README and untracked `.gitignore`,
`character-dev/`, and `film/` left intact.

32 files from its `character-dev/` and `film/` directories were copied and
verified byte-for-byte. `recovered-files.json` records every copied file's
absolute source path, destination path, size, and full SHA-256.
Private photographic references remain in the original checkout and were
not copied. Audio remains excluded from Git.

`LOCAL-README.md` and `LOCAL-gitignore.txt` preserve copies of the original
checkout's corresponding files. The ignored `local-branches.bundle` is a
verified, complete local Git-history backup, including all local branches.
It does not contain uncommitted files; those are preserved separately above.

## Branch inventory

GitHub returned only these two branches during the audit:

| Branch | Tip | Contents |
| --- | --- | --- |
| `main` | `e984d3d7d9142ce99ae29387c0481ff1ae514f96` | Project README only |
| `the-arrival` | `4e1e01180c86366f5f907d87fc0ed7e4b609690a` | Balloon illustration and its animation study |

The original desktop checkout also has local branches:

| Branch | Tip |
| --- | --- |
| `character-dev-004` | `e984d3d` |
| `motion-test-001` (checked out) | `e984d3d` |
| `claude/punchers-production-system` | `934ccd6` |
| `main` | `e984d3d` |
| `the-arrival` | `4e1e011` |

The bitmap artwork was untracked locally, not present in either GitHub branch.

## Verified bitmap artwork

All six files are in `character-dev/004/explorations/chatgpt/`.
See `bitmap-contact-sheet.jpg` and `bitmap-manifest.json`.

| Exact filename | Subject | Dimensions |
| --- | --- | --- |
| `07-soulful-artist-crop.webp` | Standing base character | 666 × 710 |
| `07-expression-02-smile.webp` | Standing smile | 1254 × 1254 |
| `07-expression-03-singing.webp` | Standing singing expression | 1254 × 1254 |
| `07-seated-01-neutral.webp` | Seated with guitar, neutral | 1254 × 1254 |
| `07-seated-02-smile.webp` | Seated with guitar, smile | 1254 × 1254 |
| `07-seated-03-singing.webp` | Seated with guitar, singing | 1254 × 1254 |

Each checksum matches the prefix/suffix recorded in the recovered
`character-dev/004/PROVENANCE.md`, and each copied file matches its local
source byte-for-byte. All six were visually inspected on the contact sheet.

That provenance document identifies these as ChatGPT-generated explorations
supplied by Cole, with 07 selected as the active visual reference. The original
generation prompts and full uncropped concept board are not recorded.
This audit verifies the recovered files, not their complete generation history.

## Separate original illustrations

`character-dev/004/references/original-art/` contains:

- `01-floating-balloons.jpeg` — byte-identical to the repository's
  `bea8729f-ce73-440b-804f-88e87d98273d.jpeg`; this is the separate balloon
  illustration, not the 07 bitmap performance character.
- `02-seated-guitar.png` — original red seated guitar drawing.
- `03-bama-cowboy-pony.jpg` — pony illustration.
- `04-summer-nights-boombox.jpg` — boombox illustration.

The recovered provenance document credits these original drawings to Cole
Calfee and explicitly corrects older documents' attribution to “Jim.”
Older documents are preserved as historical records.
No balloon source, derived layer, animation, or capture was changed.

## Preserved prior work

- `character-dev/004/explorations/expression-study-001/expression-study-001.png`
- `character-dev/004/explorations/archive/2026-10-20-motion-test-001-early/index.html`
- `character-dev/004/explorations/archive/2026-10-20-96px-cleanup-unsuccessful/`
- `character-dev/004/key-pose-study-001/HANDOFF.md`
- `film/pour-me-out/index.html` and supporting README/storyboard files.

The archived motion test was rejected as too limited in the recovered notes.
The 96px cleanup was rejected as a loss of fidelity. Neither is an approved
animation direction.

The storyboard contains planned beats, not completed walk/sit animation.
Its song structure and timing are explicitly unconfirmed.

## Missing sources

No completed walk-contact, walk-passing, approach, turn, sit, or inhale
drawings were found in the recovered folders. They are listed as new work
in the key-pose handoff. No local song recording is in the recovered film
folder. Request exact originals if these were made elsewhere; do not invent
replacements as part of this recovery.

## Preview scope

`bitmap-preview/index.html` loads the three unchanged seated WebP files.
It offers Play/Pause, Next pose, and selectable holds. It starts paused and
stops when hidden. This is an expression-timing reference, not an approved
performance, walking animation, strumming animation, or lip-sync result.

`bitmap-preview/share/index.html` is a self-contained version containing only
the page and three embedded source images. It makes no external requests and
contains no repository, backup, private-reference, or absolute-source links.
The directory containing that single file is the only directory served over
the local network for phone viewing. The full repository is not shared.

## Next collaboration checkpoint

Codex: preserve source truth, maintain the visual brief, and verify visual
results against the approved artwork.

Claude: implement one agreed animation beat using explicitly named source
files and acceptance criteria. Supply a small reviewable result before
expanding scope.

Before assigning a performance build, choose the beat and obtain its missing
drawings. A convincing sit cannot be produced by sliding the existing standing
drawing into the seated drawing. No new model-generated artwork is authorized
by this recovery checkpoint.
