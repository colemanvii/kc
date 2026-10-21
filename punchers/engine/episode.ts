// PUNCHERS — episode compiler.
//
// An episode is data: a tempo map and section markers for the song, a cast, the
// environments the shots are staged in, a continuous performance timeline, and a
// shot list. Each shot owns its camera and, when it is its own set-up, its staging
// (where the cast stands, which approved pose drawing is used). Performance that
// belongs to the scene rather than the set-up runs straight through the cuts.
//
// Every piece of artwork is addressed through a slot. A slot either names an
// approved file, in which case the file is drawn, or names nothing, in which case a
// labelled placeholder is drawn in its place. Swapping in Cole's poses, the Ryman
// paintings or the song is an edit to JSON, never to code; placeholders are never
// a stand-in drawing of the character or the venue.
//
// `frameAt(seconds)` returns a renderer-neutral frame description. The browser
// preview draws it with Canvas 2D; the same description is what the frame exporter
// renders, and what an After Effects or Blender camera bake would read.

import { cameraFrom, type CameraState } from './camera.ts';
import { createRig, IDENTITY, type Affine, type Rect, type Rig, type RigSpec } from './rig.ts';
import { compileTempo, resolveBeat, type Markers, type TempoMap, type TempoSpec } from './tempo.ts';
import { compileTimeline, type Timeline, type TimelineSpec } from './timeline.ts';

// ── Specs ────────────────────────────────────────────────────────────────────

export interface PlaneSpec {
  id: string;
  /**
   * "tile":   an endless repeat of a paper/texture image.
   * "sprite": a cut placed at the master rectangle it came from.
   * "slot":   a painting to come. `file: null` draws a labelled placeholder at
   *           `rect`; set `file` (and its pixel `size`) to draw the approved art,
   *           fitted inside `rect` without changing its proportions.
   */
  kind: 'tile' | 'sprite' | 'slot';
  z: number;
  file?: string | null;
  tileSize?: number;
  rect?: Rect;
  size?: [number, number];
  label?: string;
}

export interface EnvironmentSpec {
  id: string;
  /** "approved" art, or a "blockout" whose planes only test depth and framing. */
  status?: 'approved' | 'blockout';
  assetBase: string;
  /** Flat fill behind everything. */
  ground: [number, number, number];
  planes: PlaneSpec[];
}

/** One approved drawing of a character in one pose. */
export interface PoseSpec {
  /** Approved file (under the library's assetBase, or root-absolute), or null while it is missing. */
  file: string | null;
  /** Pixel size of the approved file. Required with `file`: the drawing is only ever scaled uniformly. */
  size?: [number, number];
  /** The point (fractions of the drawing) placed on the staging mark. Default: feet, [0.5, 1]. */
  anchor?: [number, number];
  /** Width ÷ height of the placeholder bracket while the drawing is missing. */
  placeholderAspect?: number;
  note?: string;
}

export interface PoseLibrary {
  character: string;
  assetBase: string;
  poses: Record<string, PoseSpec>;
}

export interface ShotSpec {
  id: string;
  title?: string;
  /** Picture-editorial description, for the shot list. */
  note?: string;
  in: string;
  out: string;
  /** Defaults to the episode's environment. */
  environment?: string;
  /** Focal length on a Super 35 16:9 gate; sets camera.lens (vertical FOV) unless keyed. */
  lensMm?: number;
  camera: TimelineSpec;
  /** Per-set-up staging: channels "<cast>.x|y|h|opacity" (sheet px; x,y is the pose anchor). */
  staging?: TimelineSpec;
  /** Which pose drawing each cast member is in, for pose-library cast. */
  cast?: Record<string, { pose: string }>;
  /** Assets this shot is waiting on (for the register and the player). */
  missing?: string[];
}

export interface CastSpec {
  z: number;
  /** A cut-out rig of a master drawing … */
  rig?: string;
  /** … or a library of approved pose drawings, chosen per shot. */
  poses?: string;
}

export interface AudioSpec {
  /** Root-absolute URL of the approved recording, or null while it is missing. */
  src: string | null;
  /** Seconds into the recording at which episode time 0 falls. */
  offset?: number;
  status: string;
  note?: string;
}

export interface EpisodeSpec {
  id: string;
  title: string;
  delivery: { width: number; height: number; fps: number; sensorHeightMm?: number };
  audio: AudioSpec;
  tempo: TempoSpec & { placeholder?: boolean };
  markers: Markers;
  environment: string;
  cast: Record<string, CastSpec>;
  performance: TimelineSpec;
  shots: string[];
}

// ── Frames ───────────────────────────────────────────────────────────────────

export interface Drawable {
  id: string;
  /** "placeholder": nothing approved to draw yet; the renderer outlines `rect` and prints `label`. */
  kind: 'tile' | 'sprite' | 'placeholder';
  file: string;
  /** Sheet-space placement: the image is drawn at `rect` under `world`. */
  rect: Rect;
  world: Affine;
  z: number;
  opacity: number;
  tileSize?: number;
  label?: string;
  /** Placeholder role, for styling: environment plane or character. */
  role?: 'environment' | 'character';
}

export interface Frame {
  seconds: number;
  beat: number;
  bar: number;
  beatInBar: number;
  shot: { id: string; index: number; beatIn: number; beatOut: number };
  camera: CameraState;
  ground: [number, number, number];
  /** 0 = picture, 1 = black. */
  fade: number;
  drawables: Drawable[];
}

export interface CompiledShot {
  id: string;
  title?: string;
  note?: string;
  missing: string[];
  environment: string;
  beatIn: number;
  beatOut: number;
  secIn: number;
  secOut: number;
  camera: Timeline;
  staging: Timeline | null;
  cast: Record<string, { pose: string }>;
}

export interface Episode {
  spec: EpisodeSpec;
  tempo: TempoMap;
  shots: CompiledShot[];
  duration: number;
  /** Every image file any frame can draw (for preloading). */
  files: string[];
  frameAt(seconds: number): Frame;
}

export interface EpisodeSources {
  shots: Record<string, ShotSpec>;
  rigs: Record<string, RigSpec>;
  poses?: Record<string, PoseLibrary>;
  environments: Record<string, EnvironmentSpec>;
}

/** Vertical field of view (degrees) of a focal length on a gate of the given height. */
export const lensToFov = (mm: number, gateMm = 14) => (2 * Math.atan(gateMm / (2 * mm)) * 180) / Math.PI;

const url = (base: string, file: string) => (file.startsWith('/') ? file : base + file);

/** Fits a w×h image inside rect, centred, preserving its proportions. */
export function containRect(rect: Rect, w: number, h: number): Rect {
  const s = Math.min(rect.w / w, rect.h / h);
  return { x: rect.x + (rect.w - w * s) / 2, y: rect.y + (rect.h - h * s) / 2, w: w * s, h: h * s };
}

// ── Compile ──────────────────────────────────────────────────────────────────

export function compileEpisode(spec: EpisodeSpec, src: EpisodeSources): Episode {
  const tempo = compileTempo(spec.tempo);
  const markers = spec.markers;
  const performance = compileTimeline(spec.performance, tempo, markers);
  const files = new Set<string>();

  const envDrawables = new Map<string, Drawable[]>();
  const environment = (id: string) => {
    if (envDrawables.has(id)) return envDrawables.get(id)!;
    const env = src.environments[id];
    if (!env) throw new Error(`environment "${id}" not provided`);
    const list = env.planes.map((p): Drawable => {
      const base = { id: `${env.id}.${p.id}`, z: p.z, opacity: 1, world: [...IDENTITY] as Affine };
      if (p.kind === 'tile' || p.kind === 'sprite') {
        if (!p.file) throw new Error(`${env.id}.${p.id}: ${p.kind} needs a file`);
        const file = url(env.assetBase, p.file);
        files.add(file);
        return { ...base, kind: p.kind, file, rect: p.rect ?? { x: 0, y: 0, w: 0, h: 0 }, tileSize: p.tileSize };
      }
      if (!p.rect) throw new Error(`${env.id}.${p.id}: slot needs a rect`);
      if (p.file) {
        if (!p.size) throw new Error(`${env.id}.${p.id}: approved file needs its pixel size`);
        const file = url(env.assetBase, p.file);
        files.add(file);
        return { ...base, kind: 'sprite', file, rect: containRect(p.rect, p.size[0], p.size[1]) };
      }
      return { ...base, kind: 'placeholder', file: '', rect: p.rect, label: p.label ?? p.id, role: 'environment' };
    });
    envDrawables.set(id, list);
    return list;
  };
  const grounds = (id: string) => src.environments[id].ground;

  const cast = Object.entries(spec.cast).map(([name, c]) => {
    if (c.rig) {
      const rigSpec = src.rigs[c.rig];
      if (!rigSpec) throw new Error(`rig "${c.rig}" for cast "${name}" not provided`);
      const rig = createRig(rigSpec) as Rig;
      for (const p of rigSpec.parts) if (p.drawing) files.add(url(rigSpec.assetBase, p.drawing.file));
      return { name, z: c.z, rig, poses: null as PoseLibrary | null };
    }
    if (c.poses) {
      const lib = src.poses?.[c.poses];
      if (!lib) throw new Error(`pose library "${c.poses}" for cast "${name}" not provided`);
      for (const [id, p] of Object.entries(lib.poses)) {
        if (p.file && !p.size) throw new Error(`${c.poses}: pose "${id}" has a file but no pixel size`);
        if (p.file) files.add(url(lib.assetBase, p.file));
      }
      return { name, z: c.z, rig: null, poses: lib };
    }
    throw new Error(`cast "${name}" needs a rig or a pose library`);
  });

  const shots: CompiledShot[] = spec.shots.map((ref) => {
    const s = src.shots[ref];
    if (!s) throw new Error(`shot "${ref}" not provided`);
    const beatIn = resolveBeat(s.in, tempo, markers);
    const beatOut = resolveBeat(s.out, tempo, markers);
    if (!(beatOut > beatIn)) throw new Error(`${s.id}: out is not after in`);
    const camSpec = s.lensMm ? { ...s.camera, defaults: { 'camera.lens': lensToFov(s.lensMm, spec.delivery.sensorHeightMm), ...s.camera.defaults } } : s.camera;
    const camera = compileTimeline(camSpec, tempo, markers);
    for (const k of ['camera.x', 'camera.y', 'camera.frame']) {
      if (!camera.channels.includes(k)) throw new Error(`${s.id}: camera needs "${k}"`);
    }
    const env = s.environment ?? spec.environment;
    environment(env);
    for (const c of cast) {
      if (!c.poses) continue;
      const pose = s.cast?.[c.name]?.pose;
      if (pose && !(pose in c.poses.poses)) throw new Error(`${s.id}: "${c.name}" pose "${pose}" is not in ${c.poses.character}'s library`);
    }
    return {
      id: s.id, title: s.title, note: s.note, missing: s.missing ?? [], environment: env,
      beatIn, beatOut, secIn: tempo.secondsAt(beatIn), secOut: tempo.secondsAt(beatOut),
      camera, staging: s.staging ? compileTimeline(s.staging, tempo, markers) : null, cast: s.cast ?? {},
    };
  });
  for (let i = 1; i < shots.length; i++) {
    if (Math.abs(shots[i].beatIn - shots[i - 1].beatOut) > 1e-9) {
      throw new Error(`${shots[i].id} does not start where ${shots[i - 1].id} ends (gaps and overlaps are editorial errors)`);
    }
  }
  const duration = shots[shots.length - 1].secOut;

  return {
    spec,
    tempo,
    shots,
    duration,
    files: [...files],
    frameAt(seconds) {
      // Pure in `seconds`: fresh channel tables every call, so frames can be
      // evaluated in any order (scrubbing, parallel export) with identical results.
      const t = Math.min(Math.max(seconds, shots[0].secIn), duration);
      const beat = tempo.beatAt(t);
      let index = shots.findIndex((s) => beat < s.beatOut);
      if (index < 0) index = shots.length - 1;
      const shot = shots[index];

      const channels = performance.evaluate(beat, {});
      if (shot.staging) shot.staging.evaluate(beat, channels);
      const camChannels = shot.camera.evaluate(beat, {});
      const camera = cameraFrom(camChannels);

      const drawables = [...environment(shot.environment)];
      for (const c of cast) {
        if (c.rig) {
          for (const p of c.rig.pose(c.name, channels)) {
            if (!p.drawing) continue;
            drawables.push({
              id: `${c.name}.${p.id}`, kind: 'sprite', file: url(c.rig.spec.assetBase, p.drawing.file),
              rect: p.drawing.rect, world: p.world, z: c.z + p.z, opacity: p.opacity,
            });
          }
          continue;
        }
        const poseId = shot.cast[c.name]?.pose;
        if (!poseId) continue; // not in this shot
        const pose = c.poses!.poses[poseId];
        const h = channels[`${c.name}.h`];
        if (!(h > 0)) throw new Error(`${shot.id}: "${c.name}" is in the shot but has no staging height`);
        const aspect = pose.file ? pose.size![0] / pose.size![1] : pose.placeholderAspect ?? 0.62;
        const w = h * aspect;
        const [ax, ay] = pose.anchor ?? [0.5, 1];
        const rect = { x: channels[`${c.name}.x`] - ax * w, y: channels[`${c.name}.y`] - ay * h, w, h };
        const opacity = channels[`${c.name}.opacity`] ?? 1;
        drawables.push(
          pose.file
            ? { id: `${c.name}.${poseId}`, kind: 'sprite', file: url(c.poses!.assetBase, pose.file), rect, world: [...IDENTITY] as Affine, z: c.z, opacity }
            : { id: `${c.name}.${poseId}`, kind: 'placeholder', file: '', rect, world: [...IDENTITY] as Affine, z: c.z, opacity, role: 'character', label: `${c.poses!.character} · ${poseId}: awaiting Cole's drawing` },
        );
      }
      // Far to near; stable for equal depth, so authored order breaks ties.
      drawables.sort((a, b) => a.z - b.z);

      const { bar, beat: beatInBar } = tempo.barBeat(beat);
      return {
        seconds: t,
        beat,
        bar,
        beatInBar,
        shot: { id: shot.id, index, beatIn: shot.beatIn, beatOut: shot.beatOut },
        camera,
        ground: grounds(shot.environment),
        fade: Math.min(1, Math.max(0, camChannels['picture.fade'] ?? 0)),
        drawables,
      };
    },
  };
}
