import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTempo, resolveBeat, resolveSeconds } from './tempo.ts';
import { compileTimeline, EASES } from './timeline.ts';
import { createRig, apply, IDENTITY, type RigSpec } from './rig.ts';
import { planeScale, project } from './camera.ts';
import { loadEpisode, readEpisode } from './load.ts';
import { compileEpisode } from './episode.ts';

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

// ── Tempo ────────────────────────────────────────────────────────────────────

const t76 = compileTempo({ kind: 'segments', beatsPerBar: 4, downbeat: 0.5, segments: [{ bar: 1, bpm: 76 }, { bar: 9, bpm: 70 }], bars: 12 });

test('tempo: segments compile to a beat grid with the tempo change on its bar', () => {
  near(t76.secondsAt(0), 0.5);
  near(t76.secondsAt(32), 0.5 + (32 * 60) / 76); // bar 9 downbeat
  near(t76.secondsAt(33) - t76.secondsAt(32), 60 / 70);
  near(t76.secondsAt(31) - t76.secondsAt(30), 60 / 76);
});

test('tempo: seconds ↔ beats round-trip, including fractional beats and both extrapolated ends', () => {
  for (const b of [-2, 0, 0.25, 7.5, 31.999, 32, 40.3, 48, 60]) near(t76.beatAt(t76.secondsAt(b)), b, 1e-9);
});

test('tempo: measured beat-times (a live, un-clicked take) interpolate between beats', () => {
  const live = compileTempo({ kind: 'beat-times', beatsPerBar: 4, times: [1.0, 1.8, 2.62, 3.41, 4.25, 5.1] });
  near(live.secondsAt(2.5), 2.62 + 0.5 * (3.41 - 2.62));
  near(live.beatAt(4.25), 4);
  assert.throws(() => compileTempo({ kind: 'beat-times', beatsPerBar: 4, times: [1, 1] }));
});

test('positions: bar:beat, seconds, markers and offsets', () => {
  const m = { verse: '3:1', 'pre-chorus': '7:3', lift: '@verse+4bars' };
  assert.equal(resolveBeat('1:1', t76), 0);
  assert.equal(resolveBeat('3:2.5', t76), 9.5);
  assert.equal(resolveBeat('@verse', t76, m), 8);
  assert.equal(resolveBeat('@verse+2bars', t76, m), 16);
  assert.equal(resolveBeat('@verse-1beat', t76, m), 7);
  assert.equal(resolveBeat('@pre-chorus', t76, m), 26);
  assert.equal(resolveBeat('@lift', t76, m), 24);
  near(resolveSeconds('@verse+0.5s', t76, m), t76.secondsAt(8) + 0.5);
  near(resolveSeconds('10s', t76), 10);
  assert.throws(() => resolveBeat('3:5', t76), /outside the bar/);
  assert.throws(() => resolveBeat('@nope', t76, m), /unknown marker/);
  assert.throws(() => resolveBeat('@a', t76, { a: '@b', b: '@a' }), /loop/);
});

// ── Timeline ─────────────────────────────────────────────────────────────────

test('eases start at 0 and land on 1', () => {
  for (const [name, f] of Object.entries(EASES)) {
    if (name !== 'hold') near(f(0), 0, 1e-12);
    near(f(1), 1, 1e-12);
  }
});

test('timeline: keys hold outside their span and ease between', () => {
  const tl = compileTimeline({ keys: { x: [{ at: '1:1', v: 10 }, { at: '2:1', v: 20, ease: 'linear' }] }, defaults: { y: 3 } }, t76);
  assert.equal(tl.evaluate(-5).x, 10);
  near(tl.evaluate(2).x, 15);
  assert.equal(tl.evaluate(99).x, 20);
  assert.equal(tl.evaluate(2).y, 3);
  assert.deepEqual(tl.span, [0, 4]);
});

test('timeline: beat-locked layers are silent at their edges and continuous through the fades', () => {
  const tl = compileTimeline({ layers: [{ type: 'osc', channel: 'y', amp: 7, periodBeats: 8, from: '1:1', to: '5:1', fadeBeats: 4 }] }, t76);
  assert.equal(tl.evaluate(0).y, 0);
  assert.equal(tl.evaluate(16).y, 0);
  let prev = 0, maxStep = 0;
  for (let b = 0; b <= 16; b += 1 / 64) {
    const v = tl.evaluate(b).y;
    maxStep = Math.max(maxStep, Math.abs(v - prev));
    prev = v;
  }
  assert.ok(maxStep < 0.1, `largest step between 1/64-beat samples is ${maxStep}`);
  // Peak lands on the beat grid: a quarter period after the layer's phase.
  near(tl.evaluate(10).y, 7);
});

// ── Rig ──────────────────────────────────────────────────────────────────────

const toyRig: RigSpec = {
  character: 'toy',
  master: { file: 'm.png', width: 100, height: 100 },
  assetBase: '/',
  parts: [
    { id: 'body', drawing: { file: 'b.png', rect: { x: 10, y: 10, w: 50, h: 50 } }, pivot: [30, 20] },
    { id: 'arm', parent: 'body', drawing: { file: 'a.png', rect: { x: 50, y: 30, w: 20, h: 10 } }, pivot: [50, 35] },
  ],
};

test('rig: rest pose puts every part exactly where it was cut (the original drawing)', () => {
  // Exact equality (0 === -0): no rounding drift may creep into the rest pose.
  for (const p of createRig(toyRig).pose('t', {})) assert.ok(p.world.every((v, i) => v === IDENTITY[i]), `${p.id}: ${p.world}`);
});

test('rig: rotation is about the pivot, and children follow their parent', () => {
  const posed = createRig(toyRig).pose('t', { 't.body.rot': 90, 't.body.tx': 5 });
  const body = posed.find((p) => p.id === 'body')!;
  const arm = posed.find((p) => p.id === 'arm')!;
  const [px, py] = apply(body.world, 30, 20);
  near(px, 35); near(py, 20); // pivot only translated
  const [ax, ay] = apply(arm.world, 50, 35); // arm pivot is 20 right / 15 below body pivot → rotated 90°
  near(ax, 35 - 15); near(ay, 20 + 20);
});

test('rig: rejects parts cut from outside the master and unknown parents', () => {
  assert.throws(() => createRig({ ...toyRig, parts: [{ id: 'x', drawing: { file: 'x', rect: { x: 90, y: 0, w: 20, h: 5 } }, pivot: [0, 0] }] }), /outside/);
  assert.throws(() => createRig({ ...toyRig, parts: [{ id: 'x', parent: 'ghost', pivot: [0, 0] }] }), /unknown parent/);
});

// ── Camera ───────────────────────────────────────────────────────────────────

test('camera: the sheet fills `frame`, nearer planes are larger, and a dolly makes them grow faster', () => {
  const vp = { width: 1280, height: 720 };
  const wide = { x: 800, y: 800, frame: 1440, lens: 30 };
  near(planeScale(wide, 0, vp), 0.5);
  assert.ok(planeScale(wide, 40, vp) > planeScale(wide, 0, vp));
  const tight = { ...wide, frame: 720 };
  const growPaper = planeScale(tight, 0, vp) / planeScale(wide, 0, vp);
  const growNear = planeScale(tight, 40, vp) / planeScale(wide, 40, vp);
  assert.ok(growNear > growPaper, 'parallax: the nearer plane grows more on a dolly-in');
  const m = project(wide, 0, vp);
  near(m[0] * 800 + m[4], 640); near(m[3] * 800 + m[5], 360); // camera point at frame centre
});

// ── Episode 000 (the proof) ─────────────────────────────────────────────────

const ep = loadEpisode('000-proof');

test('episode: shots tile the song with no gaps, every cut on a downbeat', () => {
  assert.deepEqual(ep.shots.map((s) => s.id), ['SH010', 'SH020', 'SH030']);
  for (const s of ep.shots) assert.equal(s.beatIn % 4, 0, `${s.id} cuts on beat ${s.beatIn}`);
  near(ep.duration, ep.tempo.secondsAt(48));
});

test('episode: the performance runs straight through cuts — no pose pops', () => {
  for (const s of ep.shots.slice(1)) {
    const a = ep.frameAt(s.secIn - 1e-4), b = ep.frameAt(s.secIn + 1e-4);
    assert.notEqual(a.shot.id, b.shot.id);
    const ka = a.drawables.find((d) => d.id === 'kc.body')!, kb = b.drawables.find((d) => d.id === 'kc.body')!;
    ka.world.forEach((v, i) => near(v, kb.world[i], 0.01)); // < 1/100 px across 0.2 ms
  }
});

test('episode: at the first frame KC is Cole\'s drawing at rest, and by the end the balloons have taken him out of frame', () => {
  const first = ep.frameAt(0);
  for (const d of first.drawables.filter((d) => d.id.startsWith('kc.'))) d.world.forEach((v, i) => near(v, IDENTITY[i], 1e-9));
  const last = ep.frameAt(ep.duration);
  const body = last.drawables.find((d) => d.id === 'kc.body')!;
  const vp = ep.spec.delivery;
  const m = project(last.camera, body.z, { width: vp.width, height: vp.height });
  const [, bottom] = apply(body.world, 0, body.rect.y + body.rect.h);
  assert.ok(m[3] * bottom + m[5] < 0, 'the bottom of the figure is above the top of frame');
  assert.ok(last.drawables.find((d) => d.id === 'kc.shadow')!.opacity < 0.01, 'the ground line has faded');
});

test('episode: re-timing the song moves every cut and cue with it', () => {
  const faster = loadEpisode('000-proof', (s) => ({ ...s, tempo: { ...s.tempo, segments: [{ bar: 1, bpm: 96 }], bars: 13 } as typeof s.tempo }));
  near(faster.shots[1].secIn, (16 * 60) / 96);
  assert.ok(faster.duration < ep.duration);
  assert.equal(faster.frameAt(faster.shots[1].secIn + 1e-6).shot.id, 'SH020');
});

test('episode: no shot enlarges Cole\'s pixels at the episode\'s delivery size', () => {
  const report = upsampleReport();
  for (const r of report) assert.ok(r.at720 <= 1, `${r.shot} upsamples ${r.at720.toFixed(2)}× at 720p`);
});

/** Peak screen px per master px for KC in each shot, at a given frame height. */
export function upsampleReport() {
  const z = readEpisode('000-proof').spec.cast.kc.z;
  return ep.shots.map((s) => {
    let peak = 0;
    for (let t = s.secIn; t < s.secOut; t += 1 / 24) peak = Math.max(peak, planeScale(ep.frameAt(t).camera, z, { width: 1, height: 1 }));
    return { shot: s.id, at720: peak * 720, at1080: peak * 1080, at2160: peak * 2160 };
  });
}

test('report: source resolution needed per shot', () => {
  for (const r of upsampleReport()) {
    console.log(`  ${r.shot}: ${r.at720.toFixed(2)}× at 720p · ${r.at1080.toFixed(2)}× at 1080p · ${r.at2160.toFixed(2)}× at 2160p`);
  }
});

// ── Episode 001: Pour Me Out (approved ten-shot board, assets pending) ──────

import { readFileSync } from 'node:fs';
import { PUNCHERS } from './load.ts';
import type { Frame } from './episode.ts';

const pmo = loadEpisode('001-pour-me-out');
const board = JSON.parse(readFileSync(`${PUNCHERS}/episodes/001-pour-me-out/source/storyboard-review-01.json`, 'utf8'));

test('001: ten shots match the approved storyboard exactly (4/3/4/3/5/5/5/4/3/6 s, 42 s, 1008 frames)', () => {
  assert.equal(pmo.shots.length, 10);
  assert.equal(board.shots.length, 10);
  pmo.shots.forEach((s, i) => {
    const b = board.shots[i];
    near(s.secIn, b.start, 1e-9);
    near(s.secOut - s.secIn, b.duration, 1e-9);
    assert.equal(s.title, b.title);
  });
  assert.equal(pmo.duration, 42);
  assert.equal(Math.round(pmo.duration * pmo.spec.delivery.fps), 1008);
});

test('001: every frame boundary resolves to the right shot (cuts land on exact frames)', () => {
  const fps = pmo.spec.delivery.fps;
  pmo.shots.forEach((s, i) => {
    const first = Math.round(s.secIn * fps);
    near(first / fps, s.secIn, 1e-9); // every cut is on the frame grid
    assert.equal(pmo.frameAt(first / fps).shot.id, s.id);
    if (i > 0) assert.equal(pmo.frameAt((first - 1) / fps).shot.id, pmo.shots[i - 1].id);
  });
});

test('001: every shot renders its environment and Little KC\'s slot inside the frame', () => {
  for (const s of pmo.shots) {
    for (const t of [s.secIn, (s.secIn + s.secOut) / 2, s.secOut - 1 / 24]) {
      const f = pmo.frameAt(t);
      assert.ok(f.drawables.some((d) => d.id.startsWith(`${s.environment}.`)), `${s.id} draws ${s.environment}`);
      const kc = f.drawables.find((d) => d.id.startsWith('kc.'))!;
      assert.ok(kc, `${s.id}: KC slot present`);
      const m = project(f.camera, kc.z, pmo.spec.delivery);
      const cx = m[0] * (kc.rect.x + kc.rect.w / 2) + m[4], cy = m[3] * (kc.rect.y + kc.rect.h / 2) + m[5];
      assert.ok(cx > 0 && cx < 1280 && cy > 0 && cy < 720, `${s.id} @${t.toFixed(2)}: KC centre ${cx.toFixed(0)},${cy.toFixed(0)} is in frame`);
    }
  }
});

test('001: framing follows the board — KC\'s bracket height ÷ frame height is the approved scale at each shot start', () => {
  pmo.shots.forEach((s, i) => {
    if (s.id === 'SH100') return; // the retreat starts closer and lands on the board's scale
    const f = pmo.frameAt(s.secIn);
    const kc = f.drawables.find((d) => d.id.startsWith('kc.'))!;
    const scale = (planeScale(f.camera, kc.z, { width: 1, height: 1 }) * kc.rect.h);
    near(scale, board.shots[i].pos[2], 0.02);
  });
  const end = pmo.frameAt(42 - 0.5);
  const kc = end.drawables.find((d) => d.id.startsWith('kc.'))!;
  near(planeScale(end.camera, kc.z, { width: 1, height: 1 }) * kc.rect.h, board.shots[9].pos[2], 0.02);
});

test('001: the final shot fades to black over its last 0.48 s', () => {
  assert.equal(pmo.frameAt(41.4).fade, 0);
  assert.ok(pmo.frameAt(41.8).fade > 0 && pmo.frameAt(41.8).fade < 1);
  assert.equal(pmo.frameAt(42).fade, 1);
});

test('001: nothing is drawn as the character or the venue until it is approved', () => {
  for (const s of pmo.shots) {
    for (const d of pmo.frameAt(s.secIn).drawables) assert.equal(d.kind, 'placeholder', `${s.id}: ${d.id} is a placeholder, not a picture`);
  }
});

// ── Determinism and fidelity, both episodes ─────────────────────────────────

const frameKey = (f: Frame) => JSON.stringify(f);

test('frames are a pure function of time: random-order evaluation equals in-order', () => {
  for (const e of [ep, pmo]) {
    const fps = e.spec.delivery.fps;
    const n = Math.floor(e.duration * fps);
    const inOrder = Array.from({ length: n }, (_, i) => frameKey(e.frameAt(i / fps)));
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = (i * 7919 + 13) % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    for (const i of order) assert.equal(frameKey(e.frameAt(i / fps)), inOrder[i], `${e.spec.id} frame ${i}`);
  }
});

test('Cole\'s art is only ever moved, rotated and scaled uniformly — never stretched, sheared or recoloured', () => {
  for (const e of [ep, pmo]) {
    const fps = e.spec.delivery.fps;
    for (let i = 0; i < e.duration * fps; i += 3) {
      for (const d of e.frameAt(i / fps).drawables) {
        if (d.kind !== 'sprite') continue;
        const [a, b, c, dd] = d.world;
        near(a, dd, 1e-9); near(b, -c, 1e-9); // similarity transform: no stretch, no shear
        assert.ok(a * dd - b * c > 0, 'never mirrored');
      }
    }
  }
});

test('swap: an approved pose drawing replaces its placeholder by data alone, at its own proportions', () => {
  const { spec, sources } = readEpisode('001-pour-me-out');
  const lib = structuredClone(sources.poses!['little-kc']);
  // Stand-in for an approved file: Cole's floating drawing, which IS approved art.
  lib.poses.seated = { file: '/little-kc/derived/figure.png', size: [750, 800] };
  const swapped = compileEpisode(spec, { ...sources, poses: { 'little-kc': lib } });
  const kc = swapped.frameAt(1).drawables.find((d) => d.id === 'kc.seated')!;
  assert.equal(kc.kind, 'sprite');
  assert.equal(kc.file, '/little-kc/derived/figure.png');
  near(kc.rect.w / kc.rect.h, 750 / 800, 1e-9);
  assert.ok(swapped.files.includes('/little-kc/derived/figure.png'));
});

test('swap: an approved painting fills its environment slot without changing its proportions', () => {
  const { spec, sources } = readEpisode('001-pour-me-out');
  const env = structuredClone(sources.environments['ryman-mic']);
  const mic = env.planes.find((p) => p.id === 'mic')!;
  mic.file = 'microphone.png';
  mic.size = [300, 1800];
  const swapped = compileEpisode(spec, { ...sources, environments: { ...sources.environments, 'ryman-mic': env } });
  const d = swapped.frameAt(25).drawables.find((x) => x.id === 'ryman-mic.mic')!;
  assert.equal(d.kind, 'sprite');
  assert.equal(d.file, '/punchers/environments/ryman-mic/microphone.png');
  near(d.rect.w / d.rect.h, 300 / 1800, 1e-9);
  assert.throws(() => compileEpisode(spec, { ...sources, environments: { ...sources.environments, 'ryman-mic': { ...env, planes: [{ ...mic, size: undefined }] } } }), /pixel size/);
});
