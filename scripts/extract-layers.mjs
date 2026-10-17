// Derive animation layers from the canonical Little KC drawing.
//
// The master JPEG is never modified. Each derived layer is a straight-alpha PNG
// whose colour channels are the master's own pixels, untouched. Only alpha is
// computed: how far a pixel departs from the paper. Pixels within the paper's
// grain noise become transparent (the real paper shows through instead); a soft
// knee keeps antialiased stroke edges soft. Fully inked pixels are opaque and
// therefore reproduce the master exactly. Nothing is traced, redrawn, recoloured
// or inpainted.
//
// The drawing's ink forms separate islands on the paper, so the layers are
// rectangular regions whose borders are verified to contain no strokes:
//   figure  — KC, hat, both balloons, strings, horns and halo (one rigid piece)
//   shadow  — the drawn ground line beneath him
//   marks   — three stray specks on the sheet; they stay put with the paper
//
// Usage: npm run extract   (writes public/little-kc/derived/)

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = path.join(root, 'bea8729f-ce73-440b-804f-88e87d98273d.jpeg');
const OUT = path.join(root, 'public/little-kc/derived');

// Regions in master pixel coordinates [x0, y0, x1, y1) — padded beyond the ink.
const REGIONS = {
  figure: [440, 330, 1190, 1130],
  shadow: [466, 1146, 822, 1198],
};
// Stray specks on the sheet (dust / pen touches). They belong to the paper, so they
// are lifted out of the moving layers and stay fixed.
const MARKS = [
  [446, 986, 461, 1002],
  [729, 457, 755, 475],
  [1208, 582, 1236, 594],
];
// Paper tile source: an empty patch of the master, mirrored 2×2 into a seamless tile.
const TILE = [40, 40, 424, 424];

// Alpha knee, in 0–255 units of max per-channel difference from paper.
// Paper grain σ ≈ 5, so 3σ..5σ.
const KNEE_LO = 15;
const KNEE_HI = 26;

const { data, info } = await sharp(MASTER).raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;

// Paper colour: per-channel median of the whole sheet (the paper is flat; ink < 10%).
const paper = [0, 1, 2].map((c) => {
  const hist = new Uint32Array(256);
  for (let i = c; i < data.length; i += C) hist[data[i]]++;
  let acc = 0;
  for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= (W * H) / 2) return v;
  return 255;
});

// Alpha for the whole sheet.
const alpha = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) {
  let d = 0;
  for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(paper[c] - data[p * C + c]));
  alpha[p] = Math.round(255 * Math.min(1, Math.max(0, (d - KNEE_LO) / (KNEE_HI - KNEE_LO))));
}

// A pixel is drawing (not grain) when it sits in a cluster of ink.
const isStroke = (x, y) => {
  if (!alpha[y * W + x]) return false;
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      n += alpha[Math.min(H - 1, Math.max(0, y + dy)) * W + Math.min(W - 1, Math.max(0, x + dx))] > 0;
  return n > 3;
};
const inBox = (x, y, [x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1;

// Every region border must be free of strokes, or the cut would slice the drawing.
for (const [name, [x0, y0, x1, y1]] of Object.entries(REGIONS)) {
  for (let x = x0; x < x1; x++)
    for (const y of [y0, y1 - 1]) if (isStroke(x, y)) throw new Error(`${name}: stroke on border at ${x},${y}`);
  for (let y = y0; y < y1; y++)
    for (const x of [x0, x1 - 1]) if (isStroke(x, y)) throw new Error(`${name}: stroke on border at ${x},${y}`);
}

// Whatever ink lies outside every layer must be isolated paper grain, not drawing.
let grain = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (!alpha[y * W + x]) continue;
    if (Object.values(REGIONS).some((r) => inBox(x, y, r)) || MARKS.some((m) => inBox(x, y, m))) continue;
    if (isStroke(x, y)) throw new Error(`uncovered stroke at ${x},${y}`);
    grain++;
  }

// RGBA crop of the master; `exclude` boxes are made transparent.
const layer = ([x0, y0, x1, y1], exclude = []) => {
  const w = x1 - x0;
  const h = y1 - y0;
  const buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = x0 + x, sy = y0 + y;
      const s = (sy * W + sx) * C, o = (y * w + x) * 4;
      const a = exclude.some((b) => inBox(sx, sy, b)) ? 0 : alpha[sy * W + sx];
      if (!a) continue; // fully transparent: leave RGB zero so the PNG compresses
      buf[o] = data[s]; buf[o + 1] = data[s + 1]; buf[o + 2] = data[s + 2]; buf[o + 3] = a;
    }
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 });
};

await mkdir(OUT, { recursive: true });
const manifest = { source: path.basename(MASTER), width: W, height: H, paper, layers: {} };

for (const [name, r] of Object.entries(REGIONS)) {
  await layer(r, MARKS).toFile(path.join(OUT, `${name}.png`));
  manifest.layers[name] = { x: r[0], y: r[1], w: r[2] - r[0], h: r[3] - r[1] };
}
manifest.layers.marks = [];
for (const [i, m] of MARKS.entries()) {
  const file = `mark-${i + 1}.png`;
  await layer(m).toFile(path.join(OUT, file));
  manifest.layers.marks.push({ file, x: m[0], y: m[1], w: m[2] - m[0], h: m[3] - m[1] });
}
manifest.droppedGrainPixels = grain;

// Seamless paper tile from the real sheet.
{
  const [x0, y0, x1] = TILE;
  const s = x1 - x0;
  const tile = Buffer.alloc(4 * s * s * 3);
  for (let y = 0; y < 2 * s; y++)
    for (let x = 0; x < 2 * s; x++) {
      const sx = x0 + (x < s ? x : 2 * s - 1 - x);
      const sy = y0 + (y < s ? y : 2 * s - 1 - y);
      data.copy(tile, (y * 2 * s + x) * 3, (sy * W + sx) * C, (sy * W + sx) * C + 3);
    }
  await sharp(tile, { raw: { width: 2 * s, height: 2 * s, channels: 3 } })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(path.join(OUT, 'paper.jpg'));
  manifest.tile = { file: 'paper.jpg', x: x0, y: y0, size: s, output: 2 * s };
}

await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('paper', paper, 'grain pixels left to paper:', grain);
