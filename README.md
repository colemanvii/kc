# KC

Creative workspace for Kashus Culpepper.

## Purpose

A home for Little KC character animation, *The Arrival*, interactive web experiences, and future Kashus Culpepper creative projects.

## Principles

- Preserve the original Little KC artwork and character design. No substitutes or redrawing without approval.
- Work in development branches. Do not deploy or publish experiments without review.
- Favor exceptionally crafted motion, typography, sound, and interaction over generic effects.
- Keep original source assets separate from derived animation assets.

## The Arrival (first study)

Little KC drifts down onto the paper beneath his two balloons, settles, and comes to rest exactly as Cole Calfee drew him.
Concept, beats, easing, layer extraction and an honest status report: **[docs/THE-ARRIVAL-NOTES.md](docs/THE-ARRIVAL-NOTES.md)**.
Brief: [docs/OPUS-THE-ARRIVAL.md](docs/OPUS-THE-ARRIVAL.md).

```bash
npm install
npm run dev        # http://localhost:5173  (add ?t=3.6 to freeze a moment)
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/
npm test           # choreography tests + pixel-fidelity check of derived layers
npm run capture    # after build: headless Chrome frames, fit checks, frame pacing (needs Chrome)
npm run extract    # regenerate derived layers from the master (only if extraction changes)
```

Stack: Vite + TypeScript, no runtime dependencies. `sharp` and `puppeteer-core` are dev-only tools.

## Organization

- `bea8729f-ce73-440b-804f-88e87d98273d.jpeg` — **canonical master drawing, unmodified**
- `public/little-kc/derived/` — layers derived from the master by `scripts/extract-layers.mjs` (+ `manifest.json`)
- `src/animation/` — choreography (pure `pose(t)`), with tests
- `src/experiences/arrival/` — the scene: builds layers, applies poses
- `src/styles/` — composition and paper
- `scripts/` — layer extraction, fidelity verification, browser capture
- `docs/` — briefs, notes, captures

**Status:** V1 study on branch `the-arrival`. Not deployed.
