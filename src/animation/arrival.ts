// The Arrival — choreography.
//
// A pure function of time → pose, so it can be scrubbed (?t=), tested, and later
// re-timed without touching the DOM. All distances are in master-artwork pixels;
// the scene multiplies them by the current on-screen scale.
//
// Beats (seconds):
//   0.0  Paper      — the empty sheet holds for a breath.
//   1.2  Descent    — KC drifts down into frame on a slight breeze from the right.
//                     The ensemble swings as a pendulum beneath the balloons,
//                     driven by its own horizontal deceleration.
//  ~5.0  Buoyancy   — he sinks a touch past his mark and is lifted back: one long,
//                     slow, decaying oscillation (period 5.2 s) — the balloons
//                     finding neutral lift.
//  ~14   Stillness  — the residual drift is eased to exactly zero; the final frame
//                     is the original drawing, pixel-registered.

export interface Pose {
  /** Horizontal offset from rest. */
  x: number;
  /** Vertical offset from rest (positive = lower on screen). */
  y: number;
  /** Rotation in degrees about the balloon pivot. */
  rotate: number;
  /** Uniform scale — a whisper of depth on approach. */
  scale: number;
  /** Ground-line shadow: horizontal stretch and opacity. */
  shadowScale: number;
  shadowOpacity: number;
}

export const REST: Readonly<Pose> = {
  x: 0, y: 0, rotate: 0, scale: 1, shadowScale: 1, shadowOpacity: 1,
};

export const TIMING = {
  /** Empty-paper hold before anything moves. */
  enter: 1.2,
  /** Length of the guided descent. */
  descent: 5.0,
  /** Buoyancy oscillation: amplitude (px), period (s), decay time constant (s). */
  bobAmplitude: 18,
  bobPeriod: 5.2,
  bobDecay: 4.2,
  /** Drift is windowed to zero across [settleStart, settleEnd] (from t = 0). */
  settleStart: 14,
  settleEnd: 20,
} as const;

const DRIFT_X = 56; // starts this far right of rest
const DEPTH = 0.035; // scale deficit at the top of the descent
const PEND_PERIOD = 3.6; // s — natural swing of the figure beneath the balloons
const PEND_DAMPING = 0.2; // ζ
const PEND_LENGTH = 520; // px — pivot (balloons) to centre of mass (body)
const DRAG_LEAN = 0.05; // deg of lean per px/s of drift — air drag on the balloons

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (v: number) => { const u = clamp01(v); return u * u * (3 - 2 * u); };
const smootherstep = (v: number) => { const u = clamp01(v); return u * u * u * (u * (6 * u - 15) + 10); };

/**
 * Descent profile: arrives already moving (non-zero initial velocity — he is
 * mid-flight when he crosses the frame edge), then a long deceleration with a
 * soft, velocity-continuous landing. 1 → 0.
 */
const descent = (p: number) => Math.pow(1 - clamp01(p), 2.2);
const drift = (p: number) => Math.pow(1 - clamp01(p), 2.6);

/** Buoyancy: a slow sine under exponential decay, faded in so velocity stays continuous. */
function buoyancy(t: number): number {
  const t0 = TIMING.enter + TIMING.descent * 0.72;
  if (t <= t0) return 0;
  const u = t - t0;
  const ramp = smoothstep(u / 1.1);
  return TIMING.bobAmplitude * ramp * Math.exp(-u / TIMING.bobDecay) * Math.sin((2 * Math.PI * u) / TIMING.bobPeriod);
}

/** Window that takes residual motion to exactly zero, without a visible stop. */
const settle = (t: number) => 1 - smootherstep((t - TIMING.settleStart) / (TIMING.settleEnd - TIMING.settleStart));

export interface Choreography {
  /** Total length; at and after this the pose is exactly REST. */
  duration: number;
  /** Distance above rest (px) at which KC starts — just outside the frame. */
  startHeight: number;
  pose(t: number): Pose;
}

/**
 * @param startHeight how far above rest KC must begin to be fully out of frame.
 */
export function createArrival(startHeight: number): Choreography {
  const { enter, descent: D } = TIMING;
  const duration = TIMING.settleEnd;

  const pathX = (t: number) => DRIFT_X * drift((t - enter) / D);
  const pathY = (t: number) => -startHeight * descent((t - enter) / D) + buoyancy(t);

  // Pendulum beneath the balloons. While drifting, drag on the balloons holds the
  // ensemble at a lean proportional to its velocity; as the breeze dies the lean
  // relaxes, and the pivot's deceleration swings the body through:
  //   θ'' = −ω²·(θ − θ_drag) − 2ζω·θ' − a_x / L
  // Integrated once, at 240 Hz, into a lookup table, from the moment he enters.
  const velX = (t: number) => (-DRIFT_X * 2.6 * Math.pow(1 - clamp01((t - enter) / D), 1.6)) / D;
  const accelX = (t: number) => (DRIFT_X * 2.6 * 1.6 * Math.pow(1 - clamp01((t - enter) / D), 0.6)) / (D * D);
  const leanAt = (t: number) => (DRAG_LEAN * velX(t) * Math.PI) / 180;
  const HZ = 240;
  const n = Math.ceil(duration * HZ) + 2;
  const swing = new Float32Array(n);
  const w = (2 * Math.PI) / PEND_PERIOD;
  const h = 1 / HZ;
  let th = leanAt(enter);
  let om = 0;
  for (let i = 0; i < n; i++) {
    const t = i * h;
    swing[i] = th;
    if (t < enter) continue;
    om += (-w * w * (th - leanAt(t)) - 2 * PEND_DAMPING * w * om - accelX(t) / PEND_LENGTH) * h;
    th += om * h;
  }
  const swingAt = (t: number) => {
    const f = clamp01(t / duration) * (n - 2);
    const i = Math.floor(f);
    return swing[i] + (swing[i + 1] - swing[i]) * (f - i);
  };

  return {
    duration,
    startHeight,
    pose(t: number): Pose {
      if (t >= duration) return { ...REST };
      const k = settle(t);
      const x = pathX(t) * k;
      const y = pathY(t) * k;
      const rotate = ((swingAt(t) * 180) / Math.PI) * k;
      const p = clamp01((t - enter) / D);
      const scale = 1 - DEPTH * Math.pow(1 - p, 1.6) * k;

      // The drawn ground line answers his height: wider and fainter while he is
      // high, gathering as he nears; it barely tightens when he dips.
      const height = -y; // > 0 above rest
      const shadowScale = height > 0 ? 1 + 0.32 * clamp01(height / 700) : 1 - 0.0025 * Math.min(-height, 20);
      const shadowOpacity = height > 0 ? Math.pow(1 - clamp01(height / 760), 1.8) : 1;

      return { x, y, rotate, scale, shadowScale, shadowOpacity };
    },
  };
}
