import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createArrival, REST, TIMING } from './arrival.ts';

const arrival = createArrival(1600);
const FPS = 120;
const frames = Array.from({ length: Math.ceil(arrival.duration * FPS) + 1 }, (_, i) => arrival.pose(i / FPS));

test('begins on empty paper: KC is fully above the frame during the opening hold', () => {
  for (const t of [0, 0.5, TIMING.enter]) {
    const p = arrival.pose(t);
    assert.ok(p.y <= -1600 + 1, `y=${p.y} at t=${t}`);
    assert.equal(p.shadowOpacity, 0);
  }
});

test('ends exactly on the original drawing', () => {
  assert.deepEqual(arrival.pose(arrival.duration), REST);
  assert.deepEqual(arrival.pose(arrival.duration + 10), REST);
  const nearlyDone = arrival.pose(arrival.duration - 1 / FPS);
  for (const k of ['x', 'y', 'rotate'] as const) assert.ok(Math.abs(nearlyDone[k]) < 0.01, `${k}=${nearlyDone[k]}`);
});

test('every frame is finite', () => {
  for (const p of frames) for (const v of Object.values(p)) assert.ok(Number.isFinite(v));
});

test('motion is continuous — no frame-to-frame jumps once in view', () => {
  const start = Math.ceil((TIMING.enter + 0.4) * FPS);
  for (let i = start + 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    assert.ok(Math.abs(b.y - a.y) < 12, `y jump at frame ${i}`);
    assert.ok(Math.abs(b.x - a.x) < 2, `x jump at frame ${i}`);
    assert.ok(Math.abs(b.rotate - a.rotate) < 0.05, `rotate jump at frame ${i}`);
  }
});

test('arrival dips past its mark only gently, and the swing stays restrained', () => {
  const maxDip = Math.max(...frames.map((p) => p.y));
  assert.ok(maxDip > 2 && maxDip < 20, `dip=${maxDip}`);
  const maxTilt = Math.max(...frames.map((p) => Math.abs(p.rotate)));
  assert.ok(maxTilt < 2.5, `tilt=${maxTilt}`);
});

test('the shadow gathers as KC nears the ground', () => {
  const mid = arrival.pose(TIMING.enter + TIMING.descent * 0.6);
  const late = arrival.pose(TIMING.enter + TIMING.descent);
  assert.ok(mid.shadowOpacity < late.shadowOpacity);
  assert.ok(mid.shadowScale > late.shadowScale);
});
