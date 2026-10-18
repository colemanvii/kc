// PUNCHERS — tempo map.
//
// Musical time is the authoring clock. Shots, cuts and performance cues are
// written in bars and beats ("9:1", "@chorus1+2bars"), and this module turns them
// into seconds against the song's actual timing. When the real stem and its beat
// map arrive, every shot re-times itself; nothing is re-keyed by hand.
//
// Internally the map is a beat grid: the time in seconds of every beat. Two
// authoring forms compile to it:
//   • "segments"   — constant-tempo spans (bpm changes at given bars). Good for
//                    placeholders and click-tracked recordings.
//   • "beat-times" — a list of measured beat timestamps (tapped or detected from
//                    the master stem). Required for a live, un-clicked performance,
//                    which breathes off any grid.
// Between beats, time is interpolated linearly; beyond the ends, the nearest
// interval is extended.

export interface TempoSegments {
  kind: 'segments';
  beatsPerBar: number;
  /** Seconds at which bar 1, beat 1 sounds (after count-in / pickup). */
  downbeat: number;
  /** Tempo changes, sorted by bar. The first must be at bar 1. */
  segments: { bar: number; bpm: number }[];
  /** How many bars to compile. */
  bars: number;
}

export interface TempoBeatTimes {
  kind: 'beat-times';
  beatsPerBar: number;
  /** Seconds of each beat, starting at bar 1 beat 1. */
  times: number[];
}

export type TempoSpec = TempoSegments | TempoBeatTimes;

export interface TempoMap {
  beatsPerBar: number;
  /** Seconds → absolute beat (0 = bar 1 beat 1; fractional between beats). */
  beatAt(seconds: number): number;
  /** Absolute beat → seconds. */
  secondsAt(beat: number): number;
  /** Absolute beat → { bar, beat } with 1-based bar and beat (beat may be fractional). */
  barBeat(beat: number): { bar: number; beat: number };
  /** Every beat's time in seconds (read-only view of the grid). */
  grid: readonly number[];
}

export function compileTempo(spec: TempoSpec): TempoMap {
  const grid = spec.kind === 'beat-times' ? [...spec.times] : segmentsToGrid(spec);
  if (grid.length < 2) throw new Error('tempo map needs at least two beats');
  for (let i = 1; i < grid.length; i++) {
    if (!(grid[i] > grid[i - 1])) throw new Error(`beat ${i} is not after beat ${i - 1}`);
  }
  const n = grid.length;
  const bpb = spec.beatsPerBar;

  const beatAt = (s: number): number => {
    if (s <= grid[0]) return (s - grid[0]) / (grid[1] - grid[0]);
    if (s >= grid[n - 1]) return n - 1 + (s - grid[n - 1]) / (grid[n - 1] - grid[n - 2]);
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (grid[mid] <= s) lo = mid; else hi = mid;
    }
    return lo + (s - grid[lo]) / (grid[lo + 1] - grid[lo]);
  };

  const secondsAt = (b: number): number => {
    if (b <= 0) return grid[0] + b * (grid[1] - grid[0]);
    if (b >= n - 1) return grid[n - 1] + (b - (n - 1)) * (grid[n - 1] - grid[n - 2]);
    const i = Math.floor(b);
    return grid[i] + (b - i) * (grid[i + 1] - grid[i]);
  };

  const barBeat = (b: number) => {
    const bar = Math.floor(b / bpb);
    return { bar: bar + 1, beat: b - bar * bpb + 1 };
  };

  return { beatsPerBar: bpb, beatAt, secondsAt, barBeat, grid };
}

function segmentsToGrid(spec: TempoSegments): number[] {
  const { beatsPerBar: bpb, downbeat, segments, bars } = spec;
  if (!segments.length || segments[0].bar !== 1) throw new Error('first tempo segment must start at bar 1');
  const total = bars * bpb + 1; // include the downbeat after the last bar
  const grid: number[] = [];
  let t = downbeat;
  let seg = 0;
  for (let b = 0; b < total; b++) {
    const bar = Math.floor(b / bpb) + 1;
    while (seg + 1 < segments.length && segments[seg + 1].bar <= bar) seg++;
    grid.push(t);
    t += 60 / segments[seg].bpm;
  }
  return grid;
}

// ── Musical positions ─────────────────────────────────────────────────────────
//
// A position is one of:
//   "9:1"            bar 9, beat 1        "9:2.5"  bar 9, halfway through beat 2
//   "12.5s"          absolute seconds (for things that follow picture, not music)
//   "@chorus1"       a named section marker
//   "@chorus1+2bars" / "@lift-1beat" / "@verse1+0.5s"   offset from a marker

export type Markers = Record<string, string>;

const OFFSET = /^([+-])(\d+(?:\.\d+)?)(bars?|beats?|s)$/;

/** Resolves a musical position to an absolute beat. */
export function resolveBeat(pos: string, tempo: TempoMap, markers: Markers = {}, depth = 0): number {
  if (depth > 8) throw new Error(`marker loop resolving "${pos}"`);
  const p = pos.trim();
  if (p.startsWith('@')) {
    const m = /^@([\w-]+?)([+-]\d+(?:\.\d+)?(?:bars?|beats?|s))?$/.exec(p);
    if (!m) throw new Error(`bad marker reference "${pos}"`);
    const [, name, offset] = m;
    if (!(name in markers)) throw new Error(`unknown marker "@${name}"`);
    const base = resolveBeat(markers[name], tempo, markers, depth + 1);
    if (!offset) return base;
    const o = OFFSET.exec(offset);
    if (!o) throw new Error(`bad offset "${offset}" in "${pos}"`);
    const sign = o[1] === '-' ? -1 : 1;
    const amount = Number(o[2]) * sign;
    if (o[3] === 's') return tempo.beatAt(tempo.secondsAt(base) + amount);
    return base + amount * (o[3].startsWith('bar') ? tempo.beatsPerBar : 1);
  }
  if (p.endsWith('s')) {
    const s = Number(p.slice(0, -1));
    if (!Number.isFinite(s)) throw new Error(`bad seconds "${pos}"`);
    return tempo.beatAt(s);
  }
  const bb = /^(\d+):(\d+(?:\.\d+)?)$/.exec(p);
  if (!bb) throw new Error(`bad musical position "${pos}" (expected "bar:beat", "Ns" or "@marker")`);
  const bar = Number(bb[1]), beat = Number(bb[2]);
  if (bar < 1 || beat < 1 || beat >= tempo.beatsPerBar + 1) throw new Error(`position "${pos}" is outside the bar`);
  return (bar - 1) * tempo.beatsPerBar + (beat - 1);
}

export const resolveSeconds = (pos: string, tempo: TempoMap, markers?: Markers) =>
  tempo.secondsAt(resolveBeat(pos, tempo, markers));
