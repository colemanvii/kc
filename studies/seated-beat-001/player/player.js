// Seated beat 001 — silent animatic player.
// Hard cuts between whole drawings on a 24 fps timeline; no transforms or easing.
(() => {
  'use strict';

  // timing.json asset paths are relative to the workspace root.
  const ROOT = '../../../';
  const TIMING_URL = '../timing.json';
  const MANIFEST_URL = '../candidates/manifest.json';

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const loading = $('loading');
  const playBtn = $('play');
  const replayBtn = $('replay');
  const prevBtn = $('prev');
  const nextBtn = $('next');
  const scrub = $('scrub');
  const loopBox = $('loop');
  const speedBtns = [...document.querySelectorAll('[data-speed]')];

  let timing = null;
  let lastFrame = 0;
  const imgs = {};          // asset key -> <img>
  const candidates = new Set();

  const state = {
    frame: 0,
    playing: false,
    speed: 1,
    anchorFrame: 0,         // frame at which the clock was last (re)started
    anchorTime: 0,          // performance.now() at that moment
    raf: 0,
  };

  const beatAt = (f) => timing.beats.find((b) => f >= b.startFrame && f < b.endFrameExclusive);

  function render() {
    const f = state.frame;
    const beat = beatAt(f);
    for (const [key, img] of Object.entries(imgs)) img.classList.toggle('on', key === beat.asset);

    $('beat-label').textContent = beat.label;
    $('beat-asset').textContent = `· ${beat.asset}`;
    $('beat-direction').textContent = beat.direction;
    $('badge').hidden = !candidates.has(timing.assets[beat.asset]);
    $('time').textContent =
      `${(f / timing.fps).toFixed(2)} s · frame ${f} / ${lastFrame}` +
      ` · beat ${timing.beats.indexOf(beat) + 1}/${timing.beats.length}`;
    scrub.value = f;
    playBtn.textContent = state.playing ? 'Pause' : 'Play';
  }

  function tick(now) {
    // A rAF timestamp can predate the anchor taken in play(); never run backwards.
    const elapsed = Math.max(0, now - state.anchorTime) / 1000;
    let f = state.anchorFrame + Math.floor(elapsed * timing.fps * state.speed);
    if (f > lastFrame) {
      if (loopBox.checked) {
        f = 0;
        state.anchorFrame = f;
        state.anchorTime = now;
      } else {
        state.frame = lastFrame;
        pause();
        return;
      }
    }
    if (f !== state.frame) {
      state.frame = f;
      render();
    }
    state.raf = requestAnimationFrame(tick);
  }

  function play() {
    if (state.playing) return;
    if (state.frame >= lastFrame) state.frame = 0;   // Play at the end restarts
    state.playing = true;
    state.anchorFrame = state.frame;
    state.anchorTime = performance.now();
    render();
    state.raf = requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    cancelAnimationFrame(state.raf);
    render();
  }

  function seek(f) {
    state.frame = Math.max(0, Math.min(lastFrame, f));
    state.anchorFrame = state.frame;
    state.anchorTime = performance.now();
    render();
  }

  function stepDrawing(dir) {
    pause();
    const beats = timing.beats;
    const i = beats.indexOf(beatAt(state.frame));
    if (dir < 0) {
      // Like a track-back button: mid-beat goes to this beat's start first.
      const target = state.frame > beats[i].startFrame ? beats[i] : beats[Math.max(0, i - 1)];
      seek(target.startFrame);
    } else {
      seek(i < beats.length - 1 ? beats[i + 1].startFrame : lastFrame);
    }
  }

  function setSpeed(s) {
    // Rebase the clock so a speed change never skips or repeats frames.
    state.anchorFrame = state.frame;
    state.anchorTime = performance.now();
    state.speed = s;
    for (const b of speedBtns) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === s));
  }

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.alt = `Drawing: ${key}`;
      img.decoding = 'async';
      img.onload = () => (img.decode ? img.decode() : Promise.resolve()).then(() => resolve(img), () => resolve(img));
      img.onerror = () => reject(new Error(`${key}: ${src}`));
      img.src = src;
    });
  }

  function fail(msg) {
    loading.classList.add('error');
    loading.textContent = msg;
    loading.hidden = false;
  }

  async function init() {
    try {
      const res = await fetch(TIMING_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      timing = await res.json();
    } catch (e) {
      fail(`Could not load timing.json (${e.message}).\nServe this folder over http rather than opening the file directly.`);
      return;
    }
    lastFrame = timing.totalFrames - 1;
    scrub.max = String(lastFrame);
    if (timing.title) $('title').textContent = timing.title;
    if (timing.status) $('status').textContent = `${timing.status} · silent, pose-and-timing study`;

    try {
      const m = await (await fetch(MANIFEST_URL, { cache: 'no-store' })).json();
      for (const a of m.artifacts || []) candidates.add(a.path);
    } catch {
      // No manifest: anything under candidates/ is still unapproved.
      for (const p of Object.values(timing.assets)) if (p.includes('/candidates/')) candidates.add(p);
    }

    const results = await Promise.allSettled(
      Object.entries(timing.assets).map(([k, p]) => loadImage(k, ROOT + p).then((img) => [k, img])),
    );
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason.message);
    if (failed.length) {
      fail(`Could not load ${failed.length} drawing(s):\n${failed.join('\n')}\nPlayback is disabled.`);
      return;
    }
    for (const r of results) {
      const [k, img] = r.value;
      imgs[k] = img;
      stage.appendChild(img);
    }
    loading.hidden = true;

    for (const el of [playBtn, replayBtn, prevBtn, nextBtn, scrub, loopBox, ...speedBtns]) el.disabled = false;
    render();
  }

  playBtn.addEventListener('click', () => (state.playing ? pause() : play()));
  replayBtn.addEventListener('click', () => { pause(); state.frame = 0; play(); });
  prevBtn.addEventListener('click', () => stepDrawing(-1));
  nextBtn.addEventListener('click', () => stepDrawing(1));
  scrub.addEventListener('input', () => {
    const f = Number(scrub.value);   // read before pause() re-renders the slider
    if (state.playing) pause();
    seek(f);
  });
  for (const b of speedBtns) b.addEventListener('click', () => setSpeed(Number(b.dataset.speed)));
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.playing) pause(); });
  document.addEventListener('keydown', (e) => {
    if (!timing || playBtn.disabled || e.target.tagName === 'INPUT') return;
    if (e.key === ' ') { e.preventDefault(); state.playing ? pause() : play(); }
    else if (e.key === 'ArrowLeft') { pause(); seek(state.frame - 1); }
    else if (e.key === 'ArrowRight') { pause(); seek(state.frame + 1); }
  });

  init();
})();
