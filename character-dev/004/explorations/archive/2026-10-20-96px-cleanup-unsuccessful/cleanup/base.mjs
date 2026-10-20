// Mode-samples the ChatGPT concept onto a true 96 px grid using palette.json.
// Output is base-96.txt: an automated underlay that is then corrected by hand into sprite-96.txt.
import sharp from '../../../../node_modules/sharp/lib/index.js';
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const pal = Object.entries(JSON.parse(readFileSync(here + 'palette.json', 'utf8')));
const rgb = h => [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
const BG = [244,232,209];
const entries = pal.map(([k,h]) => [k, h ? rgb(h) : BG]);
const src = here + '../chatgpt/07-soulful-artist-crop.webp';
const box = { left: 157, top: 52, width: 324, height: 548 };
const { data } = await sharp(src).removeAlpha().extract(box).raw().toBuffer({ resolveWithObject: true });
const N = 96, cell = box.height / N, Wn = Math.round(box.width / cell);
const nearest = (r,g,b) => { let best='.', bd=1e9; for (const [k,[R,G,Bc]] of entries) { const d=(r-R)**2+(g-G)**2+(b-Bc)**2; if (d<bd){bd=d;best=k;} } return best; };
const rows = [];
for (let y = 0; y < N; y++) {
  let row = '';
  for (let x = 0; x < Wn; x++) {
    const counts = {};
    // sample the inner 70% of each cell so neighbouring cells don't bleed in
    for (let sy = Math.floor((y+0.15)*cell); sy < Math.ceil((y+0.85)*cell); sy++)
      for (let sx = Math.floor((x+0.15)*cell); sx < Math.ceil((x+0.85)*cell); sx++) {
        if (sx >= box.width || sy >= box.height) continue;
        const i = (sy*box.width+sx)*3; const k = nearest(data[i],data[i+1],data[i+2]); counts[k]=(counts[k]||0)+1;
      }
    row += Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  }
  rows.push(row);
}
writeFileSync(here + 'base-96.txt', rows.join('\n') + '\n');
console.log(`base-96.txt ${Wn}x${N}`);
