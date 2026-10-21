// PUNCHERS — artwork-preserving cut-out rig.
//
// A part is a piece of Cole's drawing, cut from the master without being redrawn:
// its RGB pixels are the master's own, it remembers the rectangle it was cut from,
// and it has a pivot. Parts form a hierarchy. Posing applies, per part,
//
//     local = translate(tx, ty) · about(pivot, rotate(rot) · scale(sx, sy))
//     world = parent.world · local
//
// With every channel at rest (0 / 1), every world transform is the identity and
// every part lands back on the rectangle it was cut from, so the rest pose is the
// original drawing, pixel for pixel. That invariant is what `verify-rig.mjs`
// checks against the master, and what the tests check here.
//
// Channels follow the timeline's naming: "<cast>.<part>.<tx|ty|rot|sx|sy|opacity>",
// e.g. "kc.body.ty". Drivers derive channels from other channels (the drawn ground
// line answering KC's height) so animators key intent, not bookkeeping.

export type Affine = [a: number, b: number, c: number, d: number, e: number, f: number];

export const IDENTITY: Readonly<Affine> = [1, 0, 0, 1, 0, 0];

export interface Rect { x: number; y: number; w: number; h: number }

export interface PartSpec {
  id: string;
  parent?: string;
  /** The cut: a derived layer file and the master rectangle it came from. Omit for a null (grouping) part. */
  drawing?: { file: string; rect: Rect };
  /** Pivot in master px. */
  pivot: [number, number];
  /** Depth offset (sheet px, toward camera) relative to the cast member's plane. */
  z?: number;
}

/** The drawn ground line grows (uniformly) and fades as `from` rises above rest. */
export interface ContactDriver {
  type: 'contact';
  part: string;
  from: string;
  /** Extra size at full height (0.2 = 20% larger), applied uniformly. */
  widen: number;
  /** Height (px) at which the contact is fully widened / faded. */
  range: number;
}

export interface RigSpec {
  character: string;
  /** The canonical master drawing: never modified, the reference every part is verified against. */
  master: { file: string; width: number; height: number };
  /** URL base (relative to the site root) of the derived layer files. */
  assetBase: string;
  parts: PartSpec[];
  drivers?: ContactDriver[];
  /** Master regions inside the character's bounds that are not the character (verify-rig skips them for coverage). */
  notCharacter?: { reason: string; rects: Rect[] };
}

export interface PosedPart {
  id: string;
  drawing?: { file: string; rect: Rect };
  world: Affine;
  opacity: number;
  z: number;
}

export function multiply(m: Readonly<Affine>, n: Readonly<Affine>): Affine {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function apply(m: Readonly<Affine>, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function local(px: number, py: number, tx: number, ty: number, rotDeg: number, sx: number, sy: number): Affine {
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.cos(r), s = Math.sin(r);
  // translate(tx,ty) · translate(p) · R · S · translate(−p)
  const a = c * sx, b = s * sx, cc = -s * sy, d = c * sy;
  return [a, b, cc, d, px + tx - (a * px + cc * py), py + ty - (b * px + d * py)];
}

export interface Rig {
  spec: RigSpec;
  /** Every channel this rig reads, with its rest value. */
  rest: Record<string, number>;
  /** Poses the rig from channel values (missing channels are at rest). Parts come back in draw order. */
  pose(cast: string, channels: Record<string, number>): PosedPart[];
}

export function createRig(spec: RigSpec): Rig {
  const byId = new Map(spec.parts.map((p) => [p.id, p]));
  if (byId.size !== spec.parts.length) throw new Error(`${spec.character}: duplicate part ids`);
  for (const p of spec.parts) {
    if (p.parent && !byId.has(p.parent)) throw new Error(`${spec.character}: part "${p.id}" has unknown parent "${p.parent}"`);
    if (p.drawing) {
      const { x, y, w, h } = p.drawing.rect;
      if (x < 0 || y < 0 || x + w > spec.master.width || y + h > spec.master.height) {
        throw new Error(`${spec.character}: part "${p.id}" is cut from outside the master`);
      }
    }
  }
  // Parents must be posed before children.
  const order: PartSpec[] = [];
  const seen = new Set<string>();
  const visit = (p: PartSpec, stack: string[]) => {
    if (seen.has(p.id)) return;
    if (stack.includes(p.id)) throw new Error(`${spec.character}: parent cycle at "${p.id}"`);
    if (p.parent) visit(byId.get(p.parent)!, [...stack, p.id]);
    seen.add(p.id);
    order.push(p);
  };
  spec.parts.forEach((p) => visit(p, []));

  const rest: Record<string, number> = {};
  for (const p of spec.parts) {
    Object.assign(rest, { [`${p.id}.tx`]: 0, [`${p.id}.ty`]: 0, [`${p.id}.rot`]: 0, [`${p.id}.sx`]: 1, [`${p.id}.sy`]: 1, [`${p.id}.opacity`]: 1 });
  }

  return {
    spec,
    rest,
    pose(cast, channels) {
      const ch = (part: string, k: string) => channels[`${cast}.${part}.${k}`] ?? rest[`${part}.${k}`];
      const derived = new Map<string, number>();
      for (const d of spec.drivers ?? []) {
        // Height above rest of the driving part's pivot, in master px (positive = up).
        const height = -ch(d.from, 'ty');
        const u = Math.min(1, Math.max(0, height / d.range));
        // Uniform: the drawn line grows as a whole, never stretched out of Cole's proportions.
        const k = height > 0 ? 1 + d.widen * u : 1 - 0.0025 * Math.min(-height, 20);
        derived.set(`${d.part}.sx`, k);
        derived.set(`${d.part}.sy`, k);
        derived.set(`${d.part}.opacity`, height > 0 ? Math.pow(1 - u, 1.8) : 1);
        derived.set(`${d.part}.tx`, ch(d.from, 'tx'));
      }
      const get = (part: string, k: string) => {
        const base = ch(part, k);
        const drv = derived.get(`${part}.${k}`);
        if (drv === undefined) return base;
        // Drivers compose with whatever the animator keyed on top.
        return k === 'tx' ? base + drv : k === 'sx' || k === 'sy' || k === 'opacity' ? base * drv : drv;
      };

      const worlds = new Map<string, Affine>();
      const opac = new Map<string, number>();
      const out: PosedPart[] = [];
      for (const p of order) {
        const [px, py] = p.pivot;
        const l = local(px, py, get(p.id, 'tx'), get(p.id, 'ty'), get(p.id, 'rot'), get(p.id, 'sx'), get(p.id, 'sy'));
        const world = p.parent ? multiply(worlds.get(p.parent)!, l) : l;
        const opacity = get(p.id, 'opacity') * (p.parent ? opac.get(p.parent)! : 1);
        worlds.set(p.id, world);
        opac.set(p.id, opacity);
      }
      // Draw order is the spec's order (painter's order Cole's layers came in).
      for (const p of spec.parts) out.push({ id: p.id, drawing: p.drawing, world: worlds.get(p.id)!, opacity: opac.get(p.id)!, z: p.z ?? 0 });
      return out;
    },
  };
}
