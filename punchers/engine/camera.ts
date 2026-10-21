// PUNCHERS — 2.5D camera.
//
// A pinhole camera looking straight down at the sheet. Flat artwork lives on planes
// at depth z (sheet px toward the camera; the sheet itself is z = 0). Authors set
//
//   x, y   — the point on the sheet at frame centre (master px)
//   frame  — how much of the sheet (master px, vertically) fills the frame
//   lens   — vertical field of view in degrees (longer lens → flatter parallax)
//
// Changing `frame` is a dolly, not a zoom: the camera physically moves, so nearer
// planes grow faster than the paper behind them. That is where the dimensionality
// comes from: the same depth cue a multiplane camera gives hand-drawn cels.

import type { Affine } from './rig.ts';

export interface CameraState { x: number; y: number; frame: number; lens: number }

export interface Viewport { width: number; height: number }

/** Distance from camera to the sheet, in sheet px. */
export const distance = (c: CameraState) => c.frame / (2 * Math.tan((c.lens * Math.PI) / 360));

/** Screen px per sheet px for a plane at depth z. */
export function planeScale(c: CameraState, z: number, vp: Viewport): number {
  const D = distance(c);
  if (z >= D * 0.95) throw new Error(`plane at z=${z} is at or behind the lens (camera distance ${D.toFixed(0)})`);
  return (vp.height / c.frame) * (D / (D - z));
}

/** Sheet coordinates on plane z → screen pixels. */
export function project(c: CameraState, z: number, vp: Viewport): Affine {
  const s = planeScale(c, z, vp);
  return [s, 0, 0, s, vp.width / 2 - c.x * s, vp.height / 2 - c.y * s];
}

export function cameraFrom(channels: Record<string, number>, prefix = 'camera'): CameraState {
  return {
    x: channels[`${prefix}.x`],
    y: channels[`${prefix}.y`],
    frame: channels[`${prefix}.frame`],
    lens: channels[`${prefix}.lens`] ?? 30,
  };
}
