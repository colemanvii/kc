// Frame-accurate export of an episode through the same renderer as the preview.
//
// Serves the proof player, opens it in headless Chrome in render mode
// (?render: picture only, at delivery size), seeks every frame on the delivery
// grid, and writes a PNG sequence plus a sidecar with timecode, shot and bar:beat
// for every frame. A PNG sequence is the hand-off format: After Effects and Media
// Encoder import it directly (File › Import › PNG Sequence, frame rate from the
// sidecar), and it conforms against the song stem frame-for-frame.
//
// Usage:
//   node punchers/scripts/render-frames.mjs --episode 001-pour-me-out
//                                                           every frame → .scratch/punchers/<episode>/frames/
//   node punchers/scripts/render-frames.mjs --every 12      every 12th frame (quick check)
//   node punchers/scripts/render-frames.mjs --contact       also write review/contact-sheet.jpg (one frame a second)
//                                                           and review/shots.jpg (first, middle, last frame of every shot)
//   CHROME_PATH=… to override Chrome.

import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const every = Number(args[args.indexOf('--every') + 1]) || 1;
const contact = args.includes('--contact');
const EPISODE = args.includes('--episode') ? args[args.indexOf('--episode') + 1] : '000-proof';
const OUT = path.join(root, '.scratch/punchers', EPISODE, 'frames');
const REVIEW = path.join(root, 'punchers/episodes', EPISODE, 'review');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const server = await createServer({ configFile: path.join(root, 'punchers/vite.config.ts'), server: { port: 5182, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];

try {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:5182/?render&ep=${EPISODE}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.punchers);
  const info = await page.evaluate(async () => {
    await window.punchers.ready;
    const { duration, fps, width, height } = window.punchers;
    return { duration, fps, width, height, shots: window.punchers.shots };
  });
  await page.setViewport({ width: info.width, height: info.height, deviceScaleFactor: 1 });

  const total = Math.floor(info.duration * info.fps + 1e-6);
  const frames = [];
  const started = performance.now();
  for (let f = 0; f < total; f += every) {
    const { meta, png } = await page.evaluate(async (t) => {
      const meta = await window.punchers.seek(t);
      return { meta, png: document.querySelector('.picture').toDataURL('image/png') };
    }, f / info.fps);
    const file = `${String(f).padStart(5, '0')}.png`;
    await writeFile(path.join(OUT, file), Buffer.from(png.split(',')[1], 'base64'));
    const s = Math.floor(f / info.fps);
    const tc = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f % info.fps).padStart(2, '0')}`;
    frames.push({ frame: f, file, tc, ...meta, beat: Math.round(meta.beat * 1000) / 1000 });
  }
  const secs = (performance.now() - started) / 1000;
  await writeFile(path.join(OUT, 'frames.json'), JSON.stringify({ episode: EPISODE, ...info, every, frames }, null, 2));
  console.log(`${frames.length} frames (${info.width}×${info.height} @ ${info.fps} fps, every ${every}) in ${secs.toFixed(1)} s → ${path.relative(root, OUT)}`);

  if (contact) {
    // One frame per beat-ish, laid out as a review strip: shot id and bar:beat burned under each.
    const pick = frames.filter((_, i) => i % Math.max(1, Math.round(info.fps / every)) === 0);
    const W = 320, H = Math.round((W * info.height) / info.width), CAP = 22, COLS = 6, GAP = 8;
    const rows = Math.ceil(pick.length / COLS);
    const tiles = await Promise.all(
      pick.map(async (fr) => {
        const img = await sharp(path.join(OUT, fr.file)).resize({ width: W }).toBuffer();
        const label = Buffer.from(
          `<svg width="${W}" height="${CAP}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#12110f"/>` +
            `<text x="2" y="15" font-family="Menlo, monospace" font-size="11" fill="#c1352b">${fr.shot}</text>` +
            `<text x="58" y="15" font-family="Menlo, monospace" font-size="11" fill="#d9cfc3">${fr.tc}  bar ${fr.bar} · ${Math.floor(fr.beat + 1e-6)}</text></svg>`,
        );
        return sharp({ create: { width: W, height: H + CAP, channels: 3, background: '#12110f' } })
          .composite([{ input: img, top: 0, left: 0 }, { input: label, top: H, left: 0 }])
          .png()
          .toBuffer();
      }),
    );
    await mkdir(REVIEW, { recursive: true });
    if (every === 1) await shotSheet(frames, info);
    const file = path.join(REVIEW, 'contact-sheet.jpg');
    await sharp({ create: { width: COLS * (W + GAP) - GAP, height: rows * (H + CAP + GAP) - GAP, channels: 3, background: '#12110f' } })
      .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * (W + GAP), top: Math.floor(i / COLS) * (H + CAP + GAP) })))
      .jpeg({ quality: 84 })
      .toFile(file);
    console.log(`contact sheet: ${pick.length} frames → ${path.relative(root, file)}`);
  }
} finally {
  await browser.close();
  await server.close();
}

/** First, middle and last frame of every shot, one row per shot. Needs every frame (--every 1). */
async function shotSheet(frames, info) {
  const W = 400, H = Math.round((W * info.height) / info.width), CAP = 22, GAP = 8;
  const rows = info.shots.map((s) => {
    const first = Math.round(s.in * info.fps), last = Math.round(s.out * info.fps) - 1;
    return { s, picks: [first, Math.round((first + last) / 2), last].map((n) => frames[n]) };
  });
  const tiles = [];
  for (const [r, { s, picks }] of rows.entries()) {
    for (const [c, fr] of picks.entries()) {
      const img = await sharp(path.join(OUT, fr.file)).resize({ width: W }).toBuffer();
      const text = `${fr.shot}  ${fr.tc}  ${['in', 'mid', 'last'][c]}${c === 0 ? `  ${s.title ?? ''}` : ''}`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const label = Buffer.from(`<svg width="${W}" height="${CAP}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#12110f"/><text x="2" y="15" font-family="Menlo, monospace" font-size="11" fill="#d9cfc3">${text}</text></svg>`);
      tiles.push({ input: await sharp({ create: { width: W, height: H + CAP, channels: 3, background: '#12110f' } }).composite([{ input: img, top: 0, left: 0 }, { input: label, top: H, left: 0 }]).png().toBuffer(), left: c * (W + GAP), top: r * (H + CAP + GAP) });
    }
  }
  const file = path.join(REVIEW, 'shots.jpg');
  await sharp({ create: { width: 3 * (W + GAP) - GAP, height: rows.length * (H + CAP + GAP) - GAP, channels: 3, background: '#12110f' } }).composite(tiles).jpeg({ quality: 84 }).toFile(file);
  console.log(`shot sheet: ${rows.length} shots × in/mid/last → ${path.relative(root, file)}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
