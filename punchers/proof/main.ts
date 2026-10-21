// PUNCHERS shot proof: plays an episode folder against its tempo map.
//
//   ?t=12.3     freeze at a time (review / screenshots)
//   ?render     picture only, at delivery size, driven by window.punchers.seek()
//               (used by scripts/render-frames.mjs for frame-accurate export)
//   Space play/pause · ←/→ one frame · Shift+←/→ one bar · Home to top

import './proof.css';
import { compileEpisode, type EnvironmentSpec, type EpisodeSpec, type ShotSpec } from '../engine/episode.ts';
import type { RigSpec } from '../engine/rig.ts';
import { planeScale } from '../engine/camera.ts';
import { loadImages, render } from './render.ts';
import { createTransport } from './transport.ts';

import type { PoseLibrary } from '../engine/episode.ts';

// Every episode, character and environment in the repository is bundled; ?ep=
// picks the episode (default: the newest). Adding a folder is all it takes.
const byFolder = <T>(mods: Record<string, T>, depth: number) =>
  Object.fromEntries(Object.entries(mods).map(([f, m]) => [f.split('/').slice(-depth)[0], m]));
const episodes = byFolder(import.meta.glob<EpisodeSpec>('../episodes/*/episode.json', { eager: true, import: 'default' }), 2);
const allShots = import.meta.glob<ShotSpec>('../episodes/*/shots/*.json', { eager: true, import: 'default' });
const rigs = byFolder(import.meta.glob<RigSpec>('../characters/*/rig.json', { eager: true, import: 'default' }), 2);
const poses = byFolder(import.meta.glob<PoseLibrary>('../characters/*/poses.json', { eager: true, import: 'default' }), 2);
const environments = byFolder(import.meta.glob<EnvironmentSpec>('../environments/*/environment.json', { eager: true, import: 'default' }), 2);

const params = new URLSearchParams(location.search);
const episodeIds = Object.keys(episodes).sort();
const episodeId = params.get('ep') && episodes[params.get('ep')!] ? params.get('ep')! : episodeIds[episodeIds.length - 1];
const spec = episodes[episodeId];
const shots = Object.fromEntries(
  Object.entries(allShots)
    .filter(([f]) => f.includes(`/episodes/${episodeId}/shots/`))
    .map(([f, s]) => [f.split('/').pop()!.replace(/\.json$/, ''), s]),
);
const episode = compileEpisode(spec, { shots, rigs, poses, environments });
const { fps, width: DW, height: DH } = spec.delivery;
const castZ = spec.cast.kc.z;

const renderMode = params.has('render');
const frozen = params.get('t');

const $ = <T extends Element>(s: string) => document.querySelector<T>(s)!;
const canvas = $<HTMLCanvasElement>('.picture');
const ctx = canvas.getContext('2d', { alpha: false })!;
const screen = $<HTMLElement>('.screen');

declare global {
  interface Window {
    punchers?: { ready: Promise<void>; duration: number; fps: number; width: number; height: number; shots: { id: string; title?: string; in: number; out: number }[]; seek(t: number): Promise<{ shot: string; bar: number; beat: number }> };
  }
}

// ── Sizing ───────────────────────────────────────────────────────────────────

let vp = { width: DW, height: DH };
let dpr = 1;
function layout() {
  if (renderMode) {
    vp = { width: DW, height: DH };
    dpr = 1;
  } else {
    const r = screen.getBoundingClientRect();
    vp = { width: r.width, height: r.width * (DH / DW) };
    dpr = Math.min(window.devicePixelRatio || 1, 2);
  }
  canvas.width = Math.round(vp.width * dpr);
  canvas.height = Math.round(vp.height * dpr);
  canvas.style.width = `${vp.width}px`;
  canvas.style.height = `${vp.height}px`;
}

// ── Readouts ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
const timecode = (s: number) => {
  const f = Math.floor(s * fps + 1e-6);
  return `${pad(Math.floor(f / (fps * 3600)))}:${pad(Math.floor(f / (fps * 60)) % 60)}:${pad(Math.floor(f / fps) % 60)}:${pad(f % fps)}`;
};

const ui = renderMode
  ? null
  : {
      play: $<HTMLButtonElement>('.play'),
      tc: $<HTMLOutputElement>('.tc'),
      bb: $<HTMLOutputElement>('.bb'),
      shot: $<HTMLOutputElement>('.shot'),
      note: $<HTMLParagraphElement>('.note'),
      missing: $<HTMLParagraphElement>('.missing'),
      status: $<HTMLParagraphElement>('.status'),
      scrub: $<HTMLElement>('.scrub'),
      head: $<HTMLElement>('.head'),
      click: $<HTMLInputElement>('.click'),
      guides: $<HTMLInputElement>('.show-guides'),
      guideBox: $<HTMLElement>('.guides'),
    };

// ── Draw ─────────────────────────────────────────────────────────────────────

const frameIndex = (s: number) => Math.floor(s * fps + 1e-6);
let images: Map<string, HTMLImageElement> = new Map();

function draw(seconds: number) {
  // Picture is sampled on the delivery frame grid even in preview, so what you
  // review is what renders out: no in-between frames that the export won't have.
  const t = frameIndex(seconds) / fps;
  const frame = episode.frameAt(t);
  render(ctx, frame, images, vp, dpr);
  if (ui) {
    ui.tc.value = timecode(t);
    ui.bb.value = `${spec.tempo.placeholder ? '~' : ''}${frame.bar} · ${Math.floor(frame.beatInBar + 1e-6)}`;
    ui.shot.value = frame.shot.id;
    const shot = episode.shots[frame.shot.index];
    if (ui.note.dataset.shot !== shot.id) {
      ui.note.dataset.shot = shot.id;
      ui.note.textContent = [shot.title, shot.note].filter(Boolean).join('. ');
      ui.missing.textContent = shot.missing.length ? `Waiting on: ${shot.missing.join(' · ')}` : '';
    }
    ui.head.style.left = `${(t / episode.duration) * 100}%`;
    ui.scrub.setAttribute('aria-valuenow', t.toFixed(2));
    ui.scrub.setAttribute('aria-valuetext', `${timecode(t)}, bar ${frame.bar}, ${frame.shot.id}`);
    if (ui.guides.checked) {
      const up = planeScale(frame.camera, castZ, { width: 1, height: 1 });
      ui.guideBox.dataset.readout = `KC at ${(up * DH).toFixed(2)}× master px @${DH}p · ${(up * 1080).toFixed(2)}× @1080p · ${(up * 2160).toFixed(2)}× @2160p`;
      ui.guideBox.classList.toggle('is-over', up * 1080 > 1);
    }
  }
  return frame;
}

// ── Boot ─────────────────────────────────────────────────────────────────────

const ready = loadImages(episode.files).then((imgs) => { images = imgs; });

if (renderMode) {
  document.documentElement.classList.add('is-render');
  layout();
  window.punchers = {
    ready,
    duration: episode.duration,
    fps,
    width: DW,
    height: DH,
    shots: episode.shots.map((s) => ({ id: s.id, title: s.title, in: s.secIn, out: s.secOut })),
    async seek(t) {
      await ready;
      const f = draw(t);
      return { shot: f.shot.id, bar: f.bar, beat: f.beatInBar };
    },
  };
} else {
  bootPlayer();
}

function bootPlayer() {
  const u = ui!;
  const transport = createTransport(episode.tempo, episode.duration, spec.audio.src, spec.audio.offset ?? 0);

  // Scrub bar: bar ticks and the shot list, both laid out on the song's own clock.
  const bars = $<HTMLElement>('.bars');
  const lastBar = Math.round(episode.tempo.beatAt(episode.duration) / episode.tempo.beatsPerBar);
  for (let b = 0; b <= lastBar; b++) {
    const tick = document.createElement('i');
    tick.style.left = `${(episode.tempo.secondsAt(b * episode.tempo.beatsPerBar) / episode.duration) * 100}%`;
    if (b < lastBar) tick.dataset.bar = String(b + 1);
    bars.append(tick);
  }
  const shotsEl = $<HTMLElement>('.shots');
  for (const s of episode.shots) {
    const el = document.createElement('span');
    el.textContent = s.id;
    el.title = s.note ?? s.id;
    el.style.left = `${(s.secIn / episode.duration) * 100}%`;
    el.style.width = `${((s.secOut - s.secIn) / episode.duration) * 100}%`;
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); seek(s.secIn); });
    shotsEl.append(el);
  }

  const picker = $<HTMLElement>('.episodes');
  for (const id of episodeIds) {
    const a = document.createElement('a');
    a.href = `?ep=${id}`;
    a.textContent = `${id} · ${episodes[id].title}`;
    if (id === episodeId) a.setAttribute('aria-current', 'page');
    picker.append(a);
  }
  document.title = `PUNCHERS · ${spec.title}`;

  u.status.textContent = [
    spec.audio.src === null ? `No song yet. ${spec.audio.note ?? ''}` : `Audio: ${spec.audio.src}${spec.audio.offset ? ` from ${spec.audio.offset}s` : ''}`,
    spec.tempo.placeholder ? 'Bar numbers (~) come from a placeholder tempo, not the song.' : '',
  ].filter(Boolean).join(' ');

  let raf = 0;
  const loop = () => {
    transport.pump();
    const t = transport.time();
    draw(t);
    if (transport.playing && t >= episode.duration) {
      transport.pause();
      setPlaying(false);
      return;
    }
    if (transport.playing) raf = requestAnimationFrame(loop);
  };
  const setPlaying = (on: boolean) => {
    u.play.textContent = on ? 'pause' : 'play';
    u.play.setAttribute('aria-label', on ? 'Pause' : 'Play');
  };
  const toggle = async () => {
    if (transport.playing) {
      transport.pause();
      cancelAnimationFrame(raf);
      setPlaying(false);
      draw(transport.time());
    } else {
      await transport.play();
      setPlaying(true);
      raf = requestAnimationFrame(loop);
    }
  };
  const seek = (s: number) => {
    transport.seek(s);
    draw(transport.time());
  };

  u.play.addEventListener('click', toggle);
  u.click.addEventListener('change', () => transport.setClick(u.click.checked));
  u.guides.addEventListener('change', () => {
    u.guideBox.hidden = !u.guides.checked;
    draw(transport.time());
  });

  const scrubTo = (e: PointerEvent) => {
    const r = u.scrub.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * episode.duration);
  };
  u.scrub.addEventListener('pointerdown', (e) => {
    u.scrub.setPointerCapture(e.pointerId);
    scrubTo(e);
    const move = (ev: PointerEvent) => scrubTo(ev);
    u.scrub.addEventListener('pointermove', move);
    u.scrub.addEventListener('pointerup', () => u.scrub.removeEventListener('pointermove', move), { once: true });
  });

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const t = transport.time();
    const bar = episode.tempo.beatsPerBar;
    if (e.key === ' ') { e.preventDefault(); void toggle(); }
    else if (e.key === 'Home') seek(0);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      if (e.shiftKey) {
        const b = episode.tempo.beatAt(t + 1e-6) / bar;
        const target = dir > 0 ? Math.floor(b + 1e-6) + 1 : Math.ceil(b - 1e-6) - 1;
        seek(episode.tempo.secondsAt(Math.max(0, target) * bar));
      } else seek((frameIndex(t) + dir) / fps);
    }
  });

  new ResizeObserver(() => { layout(); draw(transport.time()); }).observe(screen);

  ready.then(
    () => {
      layout();
      if (frozen !== null) transport.seek(Number(frozen) || 0);
      draw(transport.time());
      document.documentElement.classList.add('is-ready');
    },
    (err: Error) => { u.status.textContent = err.message; },
  );
}
