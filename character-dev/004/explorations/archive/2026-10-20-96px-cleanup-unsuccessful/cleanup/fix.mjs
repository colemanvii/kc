// Hand-correction pass: base-96.txt (automated underlay) -> sprite-96.txt (cleaned sprite).
// Every deliberate change to the underlay is written out here, so the cleanup can be reviewed and repeated.
// Coordinates are (x, y) on the 57x96 grid, measured against the original with a grid overlay.
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const g = readFileSync(here + 'base-96.txt', 'utf8').trimEnd().split('\n').map(r => [...r]);
const H = g.length, W = g[0].length;
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '.' : g[y][x];
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
const row = (y, xs, c) => xs.forEach(x => set(x, y, c));
const span = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
const SKIN = new Set(['S', 'L', 's', 'd', 'p']);

// 1. Anti-aliased edges and background bleed were matched to eye-white; they are background.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 'W') set(x, y, '.');

// 2. Pale halo pixels on the silhouette edge are background too.
for (let pass = 0; pass < 2; pass++)
  for (let y = 0; y < 93; y++) for (let x = 0; x < W; x++)
    if ('cCgj'.includes(at(x, y)) && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => at(x+dx, y+dy) === '.')) set(x, y, '.');

// 3. Region tone rules.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const c = at(x, y);
  if (c === '.' || c === 'K' || SKIN.has(c)) continue;
  if (y <= 41) {                                   // hair: only hair tones + outline
    if ('TntJjB'.includes(c)) set(x, y, 'H');
    else if ('cCg'.includes(c)) set(x, y, 'h');
  } else if (y <= 46) {                            // jaw, beard, neck shadow
    if ('TntJjB'.includes(c)) set(x, y, 'K');
    else if ('cCg'.includes(c)) set(x, y, 's');
  } else if (y <= 63) {                            // tank top
    if ('nJB'.includes(c)) set(x, y, 'T');
    else if ('jcCgHhr'.includes(c)) set(x, y, 't');
  } else if (y <= 92) {                            // denim
    if (c === 'T' || c === 'B') set(x, y, 'n');
    else if (c === 't' || 'cCgHhr'.includes(c)) set(x, y, 'j');
  }
}

// 4. Denim and tank speckle: a pixel with no matching 4-neighbour takes its neighbours' majority.
for (const [y0, y1, tones] of [[47, 63, 'Tt'], [64, 92, 'Jjn']])
  for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y); if (!tones.includes(c)) continue;
    const nb = [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy]) => at(x+dx, y+dy)).filter(n => tones.includes(n));
    if (nb.length && !nb.includes(c)) {
      const count = {}; nb.forEach(n => count[n] = (count[n] || 0) + 1);
      set(x, y, Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]);
    }
  }

// 5. Face: clear the underlay's broken features back to skin, then place each feature by hand.
const faceLeft = y => y <= 20 ? 13 : y === 21 ? 12 : y <= 23 ? 11 : y <= 28 ? 10 : y <= 31 ? 9 : y <= 38 ? 8 : y <= 40 ? 11 : 12;
for (let y = 20; y <= 41; y++) span(y, faceLeft(y), 33, 'S');

const stamp = (x0, y0, rows) => rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== ' ') set(x0 + i, y0 + j, c); }));
// Brows: tapered arcs, two pixels thick at the crown. His left (screen right) brow lifts higher and longer.
stamp(14, 21, [' KKKKK', 'KKK   ']);
stamp(27, 22, [' KKKK  ', 'KKKKKK ', '     KK', '      K']);
// Eyes: pupils fill the top of each eye and the whites pool underneath. That is what makes him look up.
// His right eye (screen left) is smaller and keeps the original's catch-light.
stamp(13, 25, [
  ' KKKK ',
  'KKKKKK',
  'KWKKKW',
  'KKKKKW',
  'KKKKWW',
  ' WWWW ',
]);
stamp(25, 28, [
  ' KKKKK ',
  'KKKKKKK',
  'KKKKKKW',
  'KKKKKKW',
  'KKKKKWW',
  'WKKKWWW',
  ' WWWWW ',
]);
row(26, [27, 28], 's');                  // lid crease above his left eye
// Nose: pink tip highlight and nostril shadow.
row(32, [19, 20], 'p');
row(33, [17], 's'); row(34, [18, 21], 'd');
// Mustache: two halves parted at the philtrum, ends drooping; his left side runs lower.
stamp(14, 35, [
  '  KKK KKK   ',
  'KKKKK KKKKK ',
  'KK       KKK',
  '           K',
]);
row(38, [17, 22], 'd'); span(39, 18, 21, 'd');   // closed mouth, a soft smile tucked under the mustache
span(40, 18, 21, 's');                   // lower-lip shadow
span(42, 16, 19, 'H');                   // chin beard
row(33, [10, 11], 'p'); row(37, [30, 31], 'p');   // blush

// Belt: dark band under the tank hem, small cream buckle.
for (let y = 64; y <= 66; y++) for (let x = 14; x <= 31; x++) if ('Jjn'.includes(at(x, y))) set(x, y, 'n');
span(67, 20, 22, 'C');

// 6. Chain and pendant (cream beads in a V, pendant with a dark centre stripe).
[[18,48],[19,49],[19,50],[20,51],[21,52],[28,48],[27,49],[26,50],[25,51],[24,52],[23,52]].forEach(([x,y]) => set(x, y, 'C'));
stamp(21, 53, ['CCC', 'CcC', 'CBC', 'CBC', 'cCc']);

// 7. Ground shadow, then shoes: dark uppers, cream toe patch, cream sole, dark welt. Right shoe mirrors the left.
for (let y = 93; y <= 95; y++) span(y, 0, W - 1, '.');
span(94, 3, 52, 'g'); span(95, 7, 48, 'g');
const shoe = [
  '  KBccBBBBBBK  ',
  ' KBcCCcBBBBBBK ',
  ' KBBccBBBBBBBBK',
  'KBBBBBBBBBBBBBK',
  'KCCCCCCCCCCCCCK',
  ' KKKKKKKKKKKKK ',
];
stamp(9, 88, shoe);
stamp(30, 88, shoe.map(r => [...r].reverse().join('')));

writeFileSync(here + 'sprite-96.txt', g.map(r => r.join('')).join('\n') + '\n');
console.log(`sprite-96.txt ${W}x${H}`);
