// Canvas 2D renderer for a frame description. Draws Jim's layers at their sheet
// placement through the camera; never filters, recolours or resamples them beyond
// the one affine draw the camera needs.

import { project, type Viewport } from '../engine/camera.ts';
import { multiply, type Affine } from '../engine/rig.ts';
import type { Frame } from '../engine/episode.ts';

export type Images = Map<string, HTMLImageElement>;

export async function loadImages(files: string[]): Promise<Images> {
  files = files.filter(Boolean);
  const images: Images = new Map();
  await Promise.all(
    [...new Set(files)].map(
      (file) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => img.decode().catch(() => undefined).then(() => resolve());
          img.onerror = () => reject(new Error(`missing artwork: ${file}`));
          img.src = file;
          images.set(file, img);
        }),
    ),
  );
  return images;
}

const patterns = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();

/**
 * @param vp   the picture size in CSS px (camera space)
 * @param dpr  backing-store pixels per CSS px
 */
export function render(ctx: CanvasRenderingContext2D, frame: Frame, images: Images, vp: Viewport, dpr: number) {
  const px: Affine = [dpr, 0, 0, dpr, 0, 0];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgb(${frame.ground.join(' ')})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let cache = patterns.get(ctx);
  if (!cache) patterns.set(ctx, (cache = new Map()));

  for (const d of frame.drawables) {
    if (d.opacity <= 0) continue;
    const cam = multiply(px, project(frame.camera, d.z, vp));
    if (d.kind === 'placeholder') {
      placeholder(ctx, multiply(cam, d.world), d, dpr);
      continue;
    }
    const img = images.get(d.file);
    if (!img) continue;
    ctx.globalAlpha = Math.min(1, d.opacity);

    if (d.kind === 'tile') {
      let pattern = cache.get(d.file);
      if (!pattern) cache.set(d.file, (pattern = ctx.createPattern(img, 'repeat')!));
      const k = (d.tileSize ?? img.naturalWidth) / img.naturalWidth;
      pattern.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0]));
      ctx.setTransform(...cam);
      // The visible region of this plane, in sheet px, padded by a pixel.
      const x0 = (-cam[4]) / cam[0] - 1, y0 = (-cam[5]) / cam[3] - 1;
      ctx.fillStyle = pattern;
      ctx.fillRect(x0, y0, ctx.canvas.width / cam[0] + 2, ctx.canvas.height / cam[3] + 2);
      continue;
    }

    ctx.setTransform(...multiply(cam, d.world));
    ctx.drawImage(img, d.rect.x, d.rect.y, d.rect.w, d.rect.h);
  }
  ctx.globalAlpha = 1;
  if (frame.fade > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = frame.fade;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  }
}

/**
 * Missing artwork is shown as what it is: a labelled frame where the approved
 * drawing or painting will go. Never a stand-in picture. Environment slots are
 * faint depth cards (nearer = lighter); a character slot is a dashed bracket.
 */
function placeholder(ctx: CanvasRenderingContext2D, m: Affine, d: { rect: { x: number; y: number; w: number; h: number }; z: number; label?: string; role?: string; opacity: number }, dpr: number) {
  const x0 = m[0] * d.rect.x + m[4], y0 = m[3] * d.rect.y + m[5];
  const x1 = m[0] * (d.rect.x + d.rect.w) + m[4], y1 = m[3] * (d.rect.y + d.rect.h) + m[5];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = Math.min(1, d.opacity);
  const character = d.role === 'character';
  if (!character) {
    const lift = Math.max(0, Math.min(1, (d.z + 900) / 1500));
    ctx.fillStyle = `rgb(255 255 255 / ${(0.03 + 0.09 * lift).toFixed(3)})`;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  ctx.lineWidth = dpr;
  ctx.setLineDash(character ? [6 * dpr, 4 * dpr] : [2 * dpr, 4 * dpr]);
  ctx.strokeStyle = character ? 'rgb(193 53 43 / 0.9)' : 'rgb(255 255 255 / 0.32)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
  ctx.setLineDash([]);
  if (d.label) {
    const size = Math.round(11 * dpr);
    ctx.font = `${size}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = character ? 'rgb(225 120 110)' : 'rgb(255 255 255 / 0.55)';
    const lx = Math.max(x0, 0) + 6 * dpr;
    const ly = character ? y1 + size + 4 * dpr : Math.max(y0, 0) + size + 6 * dpr;
    ctx.fillText(d.label, lx, Math.min(ly, ctx.canvas.height - 6 * dpr));
  }
  ctx.globalAlpha = 1;
}
