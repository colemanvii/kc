// Sync tests for the transport, against a fake audio clock: picture time, stem
// start and every click must agree through play, pause, seek and resume.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTransport, type AudioClock } from './transport.ts';
import { compileTempo } from '../engine/tempo.ts';

const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

function fakeClock(latency = 0.021) {
  const clicks: { at: number; bus: { live: boolean } }[] = [];
  const stems: { at: number; offset: number }[] = [];
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const clock = {
    currentTime: 100, // an arbitrary, non-zero context epoch
    outputLatency: latency,
    destination: {} as AudioNode,
    async resume() {},
    createGain() {
      const node = { gain: param(), live: true, connect: (n: unknown) => n, disconnect() { node.live = false; } };
      return node as unknown as GainNode;
    },
    createOscillator() {
      let bus: { live: boolean } | null = null;
      const osc = {
        frequency: param(),
        connect: (env: unknown) => ({ connect: (b: { live: boolean }) => { bus = b; return b; } , env }),
        start: (at: number) => clicks.push({ at, bus: bus! }),
        stop() {},
      };
      return osc as unknown as OscillatorNode;
    },
    createBufferSource() {
      return { buffer: null, connect() {}, start: (at: number, offset: number) => stems.push({ at, offset }), stop() {} } as unknown as AudioBufferSourceNode;
    },
    async decodeAudioData() { return {} as AudioBuffer; },
  };
  return { clock: clock as AudioClock & { currentTime: number }, clicks, stems, latency };
}

const tempo = compileTempo({ kind: 'segments', beatsPerBar: 4, downbeat: 0, segments: [{ bar: 1, bpm: 76 }, { bar: 9, bpm: 70 }], bars: 13 });
const DURATION = tempo.secondsAt(48);

function rig(offset = 12.5) {
  const f = fakeClock();
  const transport = createTransport(tempo, DURATION, '/song.wav', offset, () => f.clock, async () => new ArrayBuffer(0));
  /** Advance the context clock in animation-frame steps, pumping the scheduler like the player does. */
  const run = (seconds: number) => {
    for (let s = 0; s < seconds; s += 1 / 60) {
      f.clock.currentTime += 1 / 60;
      transport.pump();
    }
  };
  /** Song time at which a scheduled context time is heard, given the anchor the transport used. */
  return { ...f, transport, run };
}

/** Every click still connected to the speakers must sound exactly on a grid beat. */
function assertClicksOnGrid(clicks: { at: number; bus: { live: boolean } }[], toSong: (at: number) => number) {
  const live = clicks.filter((c) => c.bus.live);
  assert.ok(live.length > 0, 'some clicks are live');
  for (const c of live) {
    const song = toSong(c.at);
    const beat = Math.round(tempo.beatAt(song));
    near(song, tempo.secondsAt(beat), 1e-6);
  }
}

test('transport: picture time follows the audio clock, minus output latency, from the play anchor', async () => {
  const { transport, clock, run, latency } = rig();
  await transport.play();
  const anchor = clock.currentTime + 0.05 + latency;
  assert.equal(transport.time(), 0, 'holds on the start frame through the headroom');
  run(3);
  near(transport.time(), clock.currentTime - latency - anchor);
});

test('transport: the stem starts on the anchor, from the episode offset into the recording', async () => {
  const { transport, clock, stems, latency } = rig(12.5);
  await transport.play();
  assert.equal(stems.length, 1);
  near(stems[0].at, clock.currentTime + 0.05); // = anchor − latency: heard exactly at the anchor
  near(stems[0].offset, 12.5);
  void latency;
});

test('transport: pause freezes picture and drops clicks already scheduled past it', async () => {
  const { transport, run, clicks } = rig();
  await transport.play();
  run(2.1);
  transport.pause();
  const t = transport.time();
  run(5);
  assert.equal(transport.time(), t, 'paused picture does not move');
  const after = clicks.filter((c) => c.bus.live).length;
  run(1);
  assert.equal(clicks.filter((c) => c.bus.live).length, after, 'no clicks scheduled while paused');
});

test('transport: seek, pause and resume — stem, clicks and picture stay on one timeline', async () => {
  const { transport, clock, run, clicks, stems, latency } = rig(12.5);
  const anchors: { ctx: number; song: number }[] = [];
  const play = async () => {
    const song = transport.time();
    await transport.play();
    anchors.push({ ctx: clock.currentTime + 0.05 + latency, song });
  };

  await play();
  run(4.37);
  transport.pause();
  await transport.seek(23.9); // across the tempo change at bar 9
  assert.equal(transport.time(), 23.9);
  await play();
  run(3.11);
  // Seek while playing: re-anchors without stopping.
  const before = clicks.length;
  await transport.seek(7.25);
  anchors.push({ ctx: clock.currentTime + 0.05 + latency, song: 7.25 });
  run(2.5);
  assert.ok(clicks.length > before);

  // Each stem start and its picture anchor agree: heard at anchor, from anchor song time.
  assert.equal(stems.length, anchors.length);
  stems.forEach((s, i) => {
    near(s.at + latency, anchors[i].ctx);
    near(s.offset, anchors[i].song + 12.5);
  });
  // Only the last anchor's clicks are live; each is exactly on a beat of the song.
  const last = anchors[anchors.length - 1];
  assertClicksOnGrid(clicks, (at) => last.song + (at + latency - last.ctx));
  // And the picture is exactly the song time the speakers are playing.
  near(transport.time(), last.song + (clock.currentTime - latency - last.ctx));
});

test('transport: stops at the end of the cut and replays from the top', async () => {
  const { transport, run } = rig();
  await transport.seek(DURATION - 0.5);
  await transport.play();
  run(1);
  assert.equal(transport.time(), DURATION);
  transport.pause();
  await transport.play();
  assert.equal(transport.time(), 0);
});
