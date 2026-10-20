// Renders a palette text map to PNG: 1x native, plus an optional zoomed view with a grid for editing.
import sharp from '../../../../node_modules/sharp/lib/index.js';
import { readFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const [mapFile, out, zoomArg, gridArg] = process.argv.slice(2);
const pal = JSON.parse(readFileSync(here + 'palette.json', 'utf8'));
const rows = readFileSync(mapFile, 'utf8').trimEnd().split('\n');
const H = rows.length, W = Math.max(...rows.map(r => r.length));
const buf = Buffer.alloc(W*H*4);
rows.forEach((r,y) => [...r].forEach((ch,x) => { const h = pal[ch]; if (h === undefined) throw new Error(`unknown '${ch}' at ${x},${y}`); if (!h) return; const i=(y*W+x)*4; buf[i]=parseInt(h.slice(0,2),16); buf[i+1]=parseInt(h.slice(2,4),16); buf[i+2]=parseInt(h.slice(4,6),16); buf[i+3]=255; }));
const z = +(zoomArg || 1);
let img = sharp(buf, { raw: { width: W, height: H, channels: 4 } });
if (z === 1) { await img.png().toFile(out); }
else {
  const big = await img.resize(W*z, H*z, { kernel: 'nearest' }).png().toBuffer();
  const lines = [];
  if (gridArg) for (let x=0;x<=W;x++) lines.push(`<line x1="${x*z}" y1="0" x2="${x*z}" y2="${H*z}" stroke="${x%8?'#0002':'#00f6'}"/>`), x%8===0 && lines.push(`<text x="${x*z+2}" y="10" font-size="9" fill="#00f">${x}</text>`);
  if (gridArg) for (let y=0;y<=H;y++) lines.push(`<line x1="0" y1="${y*z}" x2="${W*z}" y2="${y*z}" stroke="${y%8?'#0002':'#00f6'}"/>`), y%8===0 && lines.push(`<text x="2" y="${y*z+10}" font-size="9" fill="#00f">${y}</text>`);
  await sharp({ create: { width: W*z, height: H*z, channels: 4, background: '#f4e8d1' } })
    .composite([{ input: big }, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W*z}" height="${H*z}">${lines.join('')}</svg>`) }]).png().toFile(out);
}
console.log(out, `${W}x${H}`, `x${z}`);
