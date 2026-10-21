// PUNCHERS — timeline.
//
// Channels are named numbers ("camera.frame", "kc.body.ty"). A channel's value at a
// musical moment is
//
//     keyframed base  +  Σ performance layers
//
// Keyframes place intent (a push-in that lands on the chorus downbeat). Performance
// layers are continuous, beat-locked motion (breath, float, sway) whose phase is
// counted in beats, so when the singer pulls the tempo the body follows the song,
// not the wall clock. Everything resolves once to absolute beats at compile time;
// evaluation is a pure function of beat, so any frame can be scrubbed, tested or
// rendered out of order.

import { resolveBeat, type Markers, type TempoMap } from './tempo.ts';

// ── Easing ───────────────────────────────────────────────────────────────────

const { sin, cos, PI, pow } = Math;

export const EASES = {
  linear: (u: number) => u,
  hold: (u: number) => (u < 1 ? 0 : 1),
  inSine: (u: number) => 1 - cos((u * PI) / 2),
  outSine: (u: number) => sin((u * PI) / 2),
  inOutSine: (u: number) => -(cos(PI * u) - 1) / 2,
  inQuad: (u: number) => u * u,
  outQuad: (u: number) => 1 - (1 - u) * (1 - u),
  inOutQuad: (u: number) => (u < 0.5 ? 2 * u * u : 1 - pow(-2 * u + 2, 2) / 2),
  outCubic: (u: number) => 1 - pow(1 - u, 3),
  inOutCubic: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - pow(-2 * u + 2, 3) / 2),
  smootherstep: (u: number) => u * u * u * (u * (6 * u - 15) + 10),
} as const;

export type EaseName = keyof typeof EASES;

// ── Spec (what lives in JSON) ────────────────────────────────────────────────

export interface KeySpec {
  at: string;
  v: number;
  /** Easing of the segment arriving at this key. Default inOutSine. */
  ease?: EaseName;
}

/**
 * Beat-locked oscillation added on top of a channel.
 *   value += amp · env(beat) · sin(2π · (beat − phaseBeats) / periodBeats)
 * env ramps 0 → 1 over fadeBeats after `from` and 1 → 0 before `to`, with a
 * smootherstep so velocity is continuous at both ends.
 */
export interface OscSpec {
  type: 'osc';
  channel: string;
  amp: number;
  periodBeats: number;
  phaseBeats?: number;
  from: string;
  to: string;
  fadeBeats?: number;
}

export interface TimelineSpec {
  /** Value of a channel with no keys before its first key. */
  defaults?: Record<string, number>;
  keys?: Record<string, KeySpec[]>;
  layers?: OscSpec[];
}

// ── Compiled ─────────────────────────────────────────────────────────────────

interface Key { beat: number; v: number; ease: (u: number) => number }
interface Osc { channel: string; amp: number; period: number; phase: number; from: number; to: number; fade: number }

export interface Timeline {
  channels: string[];
  /** Earliest and latest beat that anything in this timeline touches. */
  span: [number, number];
  evaluate(beat: number, out?: Record<string, number>): Record<string, number>;
}

const smoother = EASES.smootherstep;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function compileTimeline(spec: TimelineSpec, tempo: TempoMap, markers: Markers = {}): Timeline {
  const at = (p: string) => resolveBeat(p, tempo, markers);

  const keys = new Map<string, Key[]>();
  for (const [ch, list] of Object.entries(spec.keys ?? {})) {
    const compiled = list.map((k) => {
      const ease = EASES[k.ease ?? 'inOutSine'];
      if (!ease) throw new Error(`${ch}: unknown ease "${k.ease}"`);
      return { beat: at(k.at), v: k.v, ease };
    });
    for (let i = 1; i < compiled.length; i++) {
      if (compiled[i].beat < compiled[i - 1].beat) throw new Error(`${ch}: key ${i} ("${list[i].at}") is before key ${i - 1}`);
    }
    if (compiled.length) keys.set(ch, compiled);
  }

  const oscs: Osc[] = (spec.layers ?? []).map((l) => {
    const from = at(l.from), to = at(l.to);
    if (!(to > from)) throw new Error(`${l.channel}: layer ends before it starts`);
    if (!(l.periodBeats > 0)) throw new Error(`${l.channel}: periodBeats must be > 0`);
    return { channel: l.channel, amp: l.amp, period: l.periodBeats, phase: l.phaseBeats ?? 0, from, to, fade: l.fadeBeats ?? 0 };
  });

  const defaults = spec.defaults ?? {};
  const channels = [...new Set([...Object.keys(defaults), ...keys.keys(), ...oscs.map((o) => o.channel)])];

  const beats = [...[...keys.values()].flat().map((k) => k.beat), ...oscs.flatMap((o) => [o.from, o.to])];
  const span: [number, number] = beats.length ? [Math.min(...beats), Math.max(...beats)] : [0, 0];

  const sample = (list: Key[], b: number) => {
    if (b <= list[0].beat) return list[0].v;
    const last = list[list.length - 1];
    if (b >= last.beat) return last.v;
    let i = 1;
    while (list[i].beat < b) i++;
    const a = list[i - 1], z = list[i];
    const u = z.beat === a.beat ? 1 : (b - a.beat) / (z.beat - a.beat);
    return a.v + (z.v - a.v) * z.ease(u);
  };

  return {
    channels,
    span,
    evaluate(b, out = {}) {
      for (const ch of channels) out[ch] = defaults[ch] ?? 0;
      for (const [ch, list] of keys) out[ch] = sample(list, b);
      for (const o of oscs) {
        if (b <= o.from || b >= o.to) continue;
        const env = o.fade > 0 ? smoother(clamp01((b - o.from) / o.fade)) * smoother(clamp01((o.to - b) / o.fade)) : 1;
        out[o.channel] += o.amp * env * sin((2 * PI * (b - o.phase)) / o.period);
      }
      return out;
    },
  };
}
