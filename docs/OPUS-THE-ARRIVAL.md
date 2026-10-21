# THE ARRIVAL — OPUS PRODUCTION HANDOFF

## Assignment
Build the first genuinely excellent, working browser prototype of **The Arrival** for Kashus Culpepper. This is a creative production pass, not a redesign of Little KC or a generic landing page. Work solely on branch `the-arrival` in `colemanvii/kc`. Do not merge to main or deploy.

## Canonical artwork
The image is already committed at the repository root:
`bea8729f-ce73-440b-804f-88e87d98273d.jpeg`
Use **this actual file**. Keep it unmodified as the canonical master and reference it correctly in the app. You may create *derived* transparent layers for animation, but document how they were extracted and preserve the original's exact proportions, contours, hand-drawn marks, colors, and imperfections. Do not generate an alternate KC, trace loosely, invent hidden character anatomy, or redraw the balloons. If clean separation cannot be achieved from this flattened JPEG without degrading character fidelity, choose tasteful whole-artwork motion for V1 and record the limitation honestly.

## Visual language
Respect the warm paper background and hand-drawn red / blue / gray linework in the drawing. No default tech-startup UI, bloated headers, decorative cards, gradients, excessive copy, loud parallax, or cutesy game effects. The result should feel authored, restrained, soulful, playful, and considered. Let the drawing carry the identity.

## Motion treatment — an initial direction, not an excuse for mechanical movement
1. Begin with meaningful empty space, then KC gently enters the composition as if suspended by two balloons.
2. The entrance should feel dimensional through precise translation, easing, and velocity; avoid a basic linear slide or fade.
3. After arrival, use extremely subtle suspended motion. Treat balloon strings, face, hat, and shadow separately *only if the asset extraction is faithful*.
4. Build a deliberate hold frame with satisfying stillness, not perpetual over-animation.
5. Reduced-motion users get an excellent static composition.
6. The responsive composition must work especially well on mobile.

## Engineering
Choose a restrained, maintainable stack. Next.js + TypeScript + GSAP is acceptable if appropriate, but don't introduce libraries without purpose. Create a runnable project with a clear README, scripts, .gitignore, and a useful directory structure. Use the canonical image. Keep assets correctly named and sourced, no external dependencies on unverifiable hosted assets. Ensure the first pass launches and builds. Animation must not depend on background streaming or flaky embeds.

## Expected deliverables
- Runnable working experience, source-controlled on `the-arrival`
- Original artwork retained, with derived layers only if extraction is actually faithful
- A concise concept/timing note, explaining the beats and easing choices
- `npm install`, `npm run dev`, `npm run build` (or equivalent) instructions
- Explicit report of what truly works, what is still rough, and any blockers
- Screenshots or preview only if you can actually obtain them; no fabricated URLs
- No deployment or merges without user approval

## Quality standard
World-class, not merely functional. Judge negative space, scale, motion rhythm, visual hierarchy, texture, authenticity to the drawing, and the quality of the final resting frame. The character remains Cole's character. If better motion would require an editable layered source file, state that transparently instead of inventing character parts.

## Coordination
Astra may later take an independent motion-polish pass. Keep components understandable and modular; don't preemptively implement a large site or merch store. This is the first study, not the final Kashus website.
