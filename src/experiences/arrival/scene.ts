// The Arrival — scene: builds the layered drawing and applies poses to it.
//
// The stage is the master sheet (1523 × 1536) in its own pixel units, scaled by
// --u (CSS px per master px, set in arrival.css). Layers sit at the exact
// coordinates they were cut from, so the rest pose is the original drawing.

import manifest from '../../../public/little-kc/derived/manifest.json';
import type { Pose } from '../../animation/arrival.ts';

const base = import.meta.env.BASE_URL + 'little-kc/derived/';

/** Pivot for the pendulum swing: between the balloons' knots, in master px. */
const PIVOT = { x: 960, y: 470 };

export interface Scene {
  root: HTMLElement;
  ready: Promise<void>;
  /** CSS px per master px, as currently laid out. */
  unit(): number;
  /** Master-px distance above rest that puts the whole figure out of view. */
  offstageHeight(): number;
  apply(pose: Pose): void;
}

function layerImg(file: string, box: { x: number; y: number; w: number; h: number }, alt = '') {
  const img = new Image();
  img.src = base + file;
  img.alt = alt;
  img.decoding = 'async';
  img.draggable = false;
  img.width = box.w;
  img.height = box.h;
  img.style.setProperty('--x', String(box.x));
  img.style.setProperty('--y', String(box.y));
  img.style.setProperty('--w', String(box.w));
  img.style.setProperty('--h', String(box.h));
  return img;
}

export function createScene(stage: HTMLElement): Scene {
  const { figure: F, shadow: S, marks } = manifest.layers;

  const markEls = marks.map((m) => layerImg(m.file, m));
  markEls.forEach((el) => el.classList.add('layer', 'layer--mark'));

  const shadow = layerImg('shadow.png', S);
  shadow.classList.add('layer', 'layer--shadow');

  const figure = layerImg(
    'figure.png',
    F,
    'Little KC drifting down beneath two balloons — a red one with devil horns and a blue one with a halo — his cowboy hat in his other hand.',
  );
  figure.classList.add('layer', 'layer--figure');
  figure.style.setProperty('--ox', String(PIVOT.x - F.x));
  figure.style.setProperty('--oy', String(PIVOT.y - F.y));

  stage.append(...markEls, shadow, figure);

  const all = [figure, shadow, ...markEls];
  // Wait for every layer to load, so the choreography never starts on a
  // half-streamed figure. decode() is only a head start on rasterising: some
  // browsers leave it pending for background pages, so it is capped.
  const loaded = (img: HTMLImageElement) =>
    img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => reject(new Error(`failed to load ${img.src}`)), { once: true });
        });
  const decoded = (img: HTMLImageElement) =>
    Promise.race([img.decode().catch(() => undefined), new Promise((r) => setTimeout(r, 400))]);
  const ready = Promise.all(all.map((img) => loaded(img).then(() => decoded(img)))).then(() => undefined);

  const unit = () => stage.getBoundingClientRect().width / manifest.width;

  return {
    root: stage,
    ready,
    unit,
    offstageHeight() {
      const u = unit();
      const restBottom = stage.getBoundingClientRect().top + (F.y + F.h) * u;
      return restBottom / u + 40;
    },
    apply(p) {
      const u = unit();
      figure.style.transform =
        `translate3d(${(p.x * u).toFixed(2)}px, ${(p.y * u).toFixed(2)}px, 0) ` +
        `rotate(${p.rotate.toFixed(4)}deg) scale(${p.scale.toFixed(5)})`;
      shadow.style.transform = `translate3d(${(p.x * u).toFixed(2)}px, 0, 0) scaleX(${p.shadowScale.toFixed(4)})`;
      shadow.style.opacity = p.shadowOpacity.toFixed(3);
    },
  };
}
