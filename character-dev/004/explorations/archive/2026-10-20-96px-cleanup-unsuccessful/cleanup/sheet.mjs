// Review sheet: ChatGPT original beside the cleaned 96 px sprite, integer scales only, with 1x/2x/3x previews
// and a face close-up. Writes ../../sheets/02-soulful-artist-96px-cleanup.png
import sharp from '../../../../node_modules/sharp/lib/index.js';
const here = new URL('.', import.meta.url).pathname;
const BG = { r: 244, g: 232, b: 209 };
const ink = '#3a2e26', soft = '#8a7a6c';
const box = { left: 157, top: 52, width: 324, height: 548 };           // figure bounds in the original
const cell = box.height / 96;

const original = await sharp(here + '../chatgpt/07-soulful-artist-crop.webp').removeAlpha().extract(box).png().toBuffer();
const sprite = here + 'sprite-96.png';
const up = (n) => sharp(sprite).resize(57 * n, 96 * n, { kernel: 'nearest' }).png().toBuffer();

// face close-up: grid cells x 6..43, y 12..47 in both
const fx = 6, fy = 12, fw = 38, fh = 36;
const faceOrig = await sharp(original).extract({ left: Math.round(fx * cell), top: Math.round(fy * cell), width: Math.round(fw * cell), height: Math.round(fh * cell) })
  .resize({ width: Math.round(fw * cell) * 2, kernel: 'nearest' }).png().toBuffer();
const faceSprite = await sharp(sprite).extract({ left: fx, top: fy, width: fw, height: fh }).resize(fw * 11, fh * 11, { kernel: 'nearest' }).png().toBuffer();

const M = 48, GAP = 56, LABEL = 44;
const topH = 576;
const items = [
  { buf: original, w: 324, h: 548, x: M, label: 'Original · ChatGPT concept', sub: '1:1 source pixels' },
  { buf: await up(6), w: 342, h: 576, x: M + 324 + GAP, label: 'Cleaned · 57 × 96 sprite', sub: '×6' },
];
const pvX = M + 324 + GAP + 342 + GAP + 8;
const previews = [[1, pvX], [2, pvX + 57 + 28], [3, pvX + 57 + 28 + 114 + 28]];
for (const [n, x] of previews) items.push({ buf: await up(n), w: 57 * n, h: 96 * n, x, label: `${n}×`, sub: '' });

const faceY = M + topH + LABEL + 40;
const faceH = Math.max(fh * 11, Math.round(fh * cell) * 2);
const W = pvX + 57 + 28 + 114 + 28 + 171 + M;
const H = faceY + faceH + LABEL + M;

const comps = items.map(it => ({ input: it.buf, left: it.x, top: M + topH - it.h }));
comps.push({ input: faceOrig, left: M, top: faceY + faceH - Math.round(fh * cell) * 2 });
comps.push({ input: faceSprite, left: M + Math.round(fw * cell) * 2 + GAP, top: faceY + faceH - fh * 11 });

const t = (x, y, s, size = 15, fill = ink, anchor = 'start') => `<text x="${x}" y="${y}" font-family="Menlo, monospace" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;
let svg = '';
for (const it of items) {
  const cx = it.x + it.w / 2;
  svg += t(cx, M + topH + 24, it.label, it.sub ? 15 : 14, ink, 'middle');
  if (it.sub) svg += t(cx, M + topH + 42, it.sub, 13, soft, 'middle');
}
svg += t(pvX, M + 14, 'Actual size previews', 13, soft);
svg += t(M + Math.round(fw * cell), faceY + faceH + 24, 'Original face · ×2', 14, ink, 'middle');
svg += t(M + Math.round(fw * cell) * 2 + GAP + fw * 11 / 2, faceY + faceH + 24, 'Cleaned face · ×11', 14, ink, 'middle');

await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([...comps, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`), left: 0, top: 0 }])
  .png().toFile(here + '../../sheets/02-soulful-artist-96px-cleanup.png');
console.log('sheet', W, H);
