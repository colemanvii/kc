// Fidelity gate for a character rig: proves every part is Cole's drawing, uncut and
// unredrawn, before anything is animated with it.
//
// For each part with a drawing:
//   • the file's size equals the rectangle it claims to be cut from;
//   • every pixel the part shows at full opacity equals the master, bit for bit;
//   • every partly transparent pixel carries the master's own RGB (alpha-only cut).
// For the rig as a whole:
//   • coverage: every ink pixel of the master inside the character's bounds is
//     shown by some part, so nothing of the drawing has been left behind.
//
// Usage: node punchers/scripts/verify-rig.mjs [character]     (default little-kc)
// Exits non-zero on any failure. Run it on every new rig and every re-export from Cole.

import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const character = process.argv[2] ?? 'little-kc';
const rig = JSON.parse(await readFile(path.join(root, 'punchers/characters', character, 'rig.json'), 'utf8'));
const { width: W, height: H } = rig.master;
const master = await sharp(path.join(root, rig.master.file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
if (master.info.width !== W || master.info.height !== H) throw new Error(`master is ${master.info.width}×${master.info.height}, rig says ${W}×${H}`);
const M = master.data;

// Paper and ink: the same thresholds the extraction used (15–26 levels from paper).
const manifestPath = path.join(root, 'public', rig.assetBase, 'manifest.json');
const paper = JSON.parse(await readFile(manifestPath, 'utf8')).paper;
const inkAt = (o) => Math.max(Math.abs(M[o] - paper[0]), Math.abs(M[o + 1] - paper[1]), Math.abs(M[o + 2] - paper[2])) > 26;

const shown = new Uint8Array(W * H);
const failures = [];
let opaque = 0;
const bounds = { x0: W, y0: H, x1: 0, y1: 0 };

for (const part of rig.parts) {
  if (!part.drawing) continue;
  const { file, rect } = part.drawing;
  const img = await sharp(path.join(root, 'public', rig.assetBase, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (img.info.width !== rect.w || img.info.height !== rect.h) {
    failures.push(`${part.id}: ${file} is ${img.info.width}×${img.info.height}, rect is ${rect.w}×${rect.h}`);
    continue;
  }
  let mismatch = 0;
  for (let r = 0; r < rect.h; r++)
    for (let c = 0; c < rect.w; c++) {
      const s = (r * rect.w + c) * 4, mp = (rect.y + r) * W + rect.x + c, o = mp * 3;
      const a = img.data[s + 3];
      if (a === 0) continue;
      shown[mp] = 1;
      if (a === 255) opaque++;
      if (img.data[s] !== M[o] || img.data[s + 1] !== M[o + 1] || img.data[s + 2] !== M[o + 2]) mismatch++;
    }
  bounds.x0 = Math.min(bounds.x0, rect.x); bounds.y0 = Math.min(bounds.y0, rect.y);
  bounds.x1 = Math.max(bounds.x1, rect.x + rect.w); bounds.y1 = Math.max(bounds.y1, rect.y + rect.h);
  console.log(`${part.id.padEnd(10)} ${file.padEnd(14)} ${rect.w}×${rect.h} at (${rect.x}, ${rect.y})  ${mismatch ? `${mismatch} pixels differ from master` : 'every shown pixel is the master\'s'}`);
  if (mismatch) failures.push(`${part.id}: ${mismatch} pixels are not the master's`);
}

// Regions the rig declares are not the character (e.g. specks on the sheet that an environment carries).
const notCharacter = rig.notCharacter?.rects ?? [];
const excluded = (x, y) => notCharacter.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
let ink = 0, missed = 0;
const missedAt = [];
for (let y = bounds.y0; y < bounds.y1; y++)
  for (let x = bounds.x0; x < bounds.x1; x++) {
    const p = y * W + x;
    if (!inkAt(p * 3) || excluded(x, y)) continue;
    ink++;
    if (!shown[p]) { missed++; if (missedAt.length < 60) missedAt.push([x, y]); }
  }
console.log(`coverage   ${ink} ink pixels in the character's bounds, ${missed} not shown by any part`);
if (missed) console.log(`           first missed: ${missedAt.map(([x, y]) => `${x},${y}`).join(' ')}`);
if (missed) failures.push(`${missed} ink pixels of the master are not in any part`);
console.log(`opaque     ${opaque} full-opacity pixels checked bit-for-bit`);

if (failures.length) {
  console.error(`FAIL\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('OK');
