// Browser check for The Arrival: builds nothing, serves dist/ with `vite preview`,
// drives the installed Chrome, and
//   • captures key frames (frozen with ?t=) at phone, tablet and desktop sizes,
//   • asserts the resting drawing sits fully inside the viewport with no overflow,
//   • plays the real arrival and reports frame pacing,
//   • checks reduced-motion visitors get the still composition immediately.
//
// Usage: npm run build && npm run capture      (CHROME_PATH=… to override Chrome)
// Output: docs/captures/*.jpg (committed) — frame pacing is printed.

import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'docs/captures');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const VIEWPORTS = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'phone-landscape': { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2 },
};
const FRAMES = [0.5, 2.4, 3.6, 4.8, 6.1, 30];
const JPEG = { type: 'jpeg', quality: 82 };

const server = await preview({ root, preview: { port: 4317, strictPort: true }, logLevel: 'silent' });
const base = 'http://localhost:4317/';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const failures = [];

try {
  await mkdir(OUT, { recursive: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => failures.push(`page error: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && failures.push(`console: ${m.text()}`));

  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    await page.setViewport(vp);
    for (const t of FRAMES) {
      await page.goto(`${base}?t=${t}`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => !document.documentElement.classList.contains('is-staged'));
      const file = `${name}-t${String(t).replace('.', '_')}.jpg`;
      if (t === 30 || name === 'phone') await page.screenshot({ path: path.join(OUT, file), ...JPEG });
    }
    const box = await page.evaluate(() => {
      const r = document.querySelector('.layer--figure').getBoundingClientRect();
      const s = document.querySelector('.layer--shadow').getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: s.bottom, vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth };
    });
    const fits = box.l >= 0 && box.t >= 0 && box.r <= box.vw && box.b <= box.vh && box.sw <= box.vw;
    console.log(`${name.padEnd(16)} rest frame ${fits ? 'fits' : 'DOES NOT FIT'}  figure ${Math.round(box.r - box.l)}×${Math.round(box.b - box.t)} in ${box.vw}×${box.vh}`);
    if (!fits) failures.push(`${name}: rest frame overflows viewport`);
  }

  // Real playback: frame pacing across the whole arrival.
  await page.setViewport(VIEWPORTS.phone);
  await page.goto(base, { waitUntil: 'networkidle0' });
  const pacing = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const deltas = [];
        let last = performance.now();
        const tick = (now) => {
          deltas.push(now - last);
          last = now;
          if (document.documentElement.classList.contains('is-resting')) return resolve(deltas);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  const sorted = [...pacing].sort((a, b) => a - b);
  const p = (q) => sorted[Math.floor(q * (sorted.length - 1))].toFixed(1);
  console.log(`playback        ${pacing.length} frames to rest; frame ms p50 ${p(0.5)} p95 ${p(0.95)} max ${p(1)}`);
  await page.screenshot({ path: path.join(OUT, 'phone-after-playback.jpg'), ...JPEG });

  // Reduced motion: no staging, no replay, the drawing at rest on first paint.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base, { waitUntil: 'networkidle0' });
  const rm = await page.evaluate(() => ({
    cls: document.documentElement.className,
    transform: document.querySelector('.layer--figure').style.transform,
    replay: getComputedStyle(document.querySelector('.replay')).display,
  }));
  const rmOk = !rm.cls.includes('is-staged') && !rm.cls.includes('is-moving') && rm.replay === 'none';
  console.log(`reduced motion  ${rmOk ? 'still composition' : 'UNEXPECTED'} ${JSON.stringify(rm)}`);
  if (!rmOk) failures.push('reduced motion did not render the still composition');
  await page.screenshot({ path: path.join(OUT, 'phone-reduced-motion.jpg'), ...JPEG });

  // Filmstrip of the phone key frames, for quick review.
  const strip = await Promise.all(
    FRAMES.map((t) => sharp(path.join(OUT, `phone-t${String(t).replace('.', '_')}.jpg`)).resize({ width: 260 }).toBuffer()),
  );
  const { height } = await sharp(strip[0]).metadata();
  await sharp({ create: { width: 270 * strip.length - 10, height, channels: 3, background: '#2b2724' } })
    .composite(strip.map((input, i) => ({ input, left: i * 270, top: 0 })))
    .jpeg({ quality: 85 })
    .toFile(path.join(OUT, 'phone-filmstrip.jpg'));
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('OK');
