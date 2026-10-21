# Seated beat 001 — four-second animatic player

## Task

Build a minimal, mobile-friendly animatic player for this one performance beat:
**he checks for an audience, takes a quiet breath, makes one down-strum,
then commits to the first sung note.**

Codex owns artwork, source verification, acting direction and visual review.
Claude owns only the playback implementation for this pass.

This is a pose-and-timing study. Do not claim smooth animation or lip sync.
No recording has been supplied, so the timing is provisional and silent.

## Exact workspace

Use `/Users/colecalfee/Documents/ChatGPT/Kash/kc`.
Repository remote is now `https://github.com/colemanvii/animation.git`.
Check the current branch is `codex/bitmap-source-audit` before editing.
Do not switch branches, reset files, push, merge, deploy, or touch the
separate `/Users/colecalfee/Sites/kc` checkout.

Write implementation files only under `studies/seated-beat-001/player/`.
Read the sibling `timing.json`; its asset paths are relative to the workspace
root. Codex may edit the timing and candidates concurrently. Do not modify
those files, the approved sources, or the existing preview.

## Source contract

Approved anchors:

- `character-dev/004/explorations/chatgpt/07-seated-01-neutral.webp`
- `character-dev/004/explorations/chatgpt/07-seated-03-singing.webp`

New candidates, generated from those anchors on 20 October 2026:

- `studies/seated-beat-001/candidates/inhale-v1.png`
- `studies/seated-beat-001/candidates/down-strum-v1.png`

These two candidates are supplied for visual review and are not yet
user-approved production art. Label that clearly in the player.
Use the whole supplied images at the same square framing. Do not redraw,
recolor, crop, downsample, morph, crossfade, auto-register, or cut up the art.
Do not use any balloon illustration or archived 96px sprite.

The current candidates still need visual review for character consistency,
registration, face position and hand/guitar contact. Do not conceal a jump
with transforms or easing. Report it.

Initial review: both candidates are 1254×1254, matching the anchor dimensions.
The intended face and strumming-arm changes are visible. The generated
lower-body/stool region is not pixel-identical to neutral: in rectangle
(280,840)–(1010,1160), mean absolute RGB difference is 5.256/255 for inhale
and 4.668/255 for strum. This measures pixel variation, not geometric
alignment. Inspect for flicker and displacement; do not assume registration
is proven merely because the dimensions match.

## Playback

Use a plain static HTML/CSS/JavaScript page; no dependencies or framework.
Load all four images before enabling Play. Use elapsed time and the supplied
24-fps timeline, with hard frame changes and deliberate holds.

- Start paused on frame 0.
- Play/Pause and Replay.
- A 0–95 frame scrubber with a readable time and current beat.
- Previous/next drawing controls.
- Playback speeds 0.5× and 1×.
- Stop on the final frame. Loop is optional and off by default.
- Pause when the page is hidden; respect reduced-motion by never autoplaying.
- Show a useful loading error instead of a broken image.

Keep a locked camera and the character fully visible. Cream background,
small controls, no decorative dashboard. Controls must fit a 390px phone
viewport and have at least 44px touch targets.

Do not add body bobbing, procedural breathing, guitar rotation, artificial
mouth animation, generated audio, or embedded music.

## Verification and return

Verify image loading, play/pause, replay, frame boundaries, speed changes,
scrubbing and stop-at-end. Check at phone and desktop widths. Confirm all
four source files are unchanged. Save one screenshot and a short
implementation note inside `player/`.

Return the exact files changed, tests performed, and any observed pose jump.
Do not report a preview URL until you have loaded it successfully.
Do not serve the whole repository over the network. If phone sharing is
needed, prepare a self-contained export inside `player/share/` containing
only the player and these four images; do not start a public deployment.

Stop after this player. The next drawing or animation pass follows visual
review, not an automatic expansion of scope.
