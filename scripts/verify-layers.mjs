// Fidelity check: recomposite the derived layers at rest over the paper — exactly
// what the browser does — and compare against the master.
//
// • strokes: opaque layer pixels must equal the master bit-for-bit.
// • sheet:   whole-image PSNR over the paper tile. The residual is paper grain,
//            which is intentionally supplied by the tile rather than the layers.
//
// Exits non-zero on any stroke drift. Writes .scratch/recomposite.png for eyeballing.

import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(root, 'public/little-kc/derived');
const manifest = JSON.parse(await readFile(path.join(DIR, 'manifest.json'), 'utf8'));
const { width: W, height: H } = manifest;

const master = await sharp(path.join(root, manifest.source)).raw().toBuffer();
const tile = await sharp(path.join(DIR, manifest.tile.file)).raw().toBuffer({ resolveWithObject: true });
const T = tile.info.width;

const out = Buffer.alloc(W * H * 3);
for (let p = 0; p < W * H; p++) {
  const x = p % W, y = (p / W) | 0;
  tile.data.copy(out, p * 3, ((y % T) * T + (x % T)) * 3, ((y % T) * T + (x % T)) * 3 + 3);
}

let opaque = 0, opaqueMismatch = 0;
const place = async (file, { x, y, w, h }) => {
  const buf = await sharp(path.join(DIR, file)).ensureAlpha().raw().toBuffer();
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const s = (r * w + c) * 4, o = ((y + r) * W + x + c) * 3;
      const a = buf[s + 3] / 255;
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(a * buf[s + k] + (1 - a) * out[o + k]);
      if (buf[s + 3] === 255) {
        opaque++;
        if (buf[s] !== master[o] || buf[s + 1] !== master[o + 1] || buf[s + 2] !== master[o + 2]) opaqueMismatch++;
      }
    }
};
await place('figure.png', manifest.layers.figure);
await place('shadow.png', manifest.layers.shadow);
for (const m of manifest.layers.marks) await place(m.file, m);

let sq = 0, maxStrokeDelta = 0;
for (let i = 0; i < W * H * 3; i++) sq += (out[i] - master[i]) ** 2;
const psnr = 10 * Math.log10((255 * 255) / (sq / (W * H * 3)));

await mkdir(path.join(root, '.scratch'), { recursive: true });
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(root, '.scratch/recomposite.png'));

console.log(`strokes: ${opaque} opaque pixels, ${opaqueMismatch} differ from master`);
console.log(`sheet:   PSNR ${psnr.toFixed(2)} dB vs master (residual = paper grain from tile)`);
if (opaqueMismatch > 0 || psnr < 30) {
  console.error('FAIL');
  process.exit(1);
}
console.log('OK');
