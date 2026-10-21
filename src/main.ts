import './styles/arrival.css';
import { createArrival, REST } from './animation/arrival.ts';
import { createScene } from './experiences/arrival/scene.ts';

const html = document.documentElement;
const stage = document.querySelector<HTMLElement>('.stage')!;
const replay = document.querySelector<HTMLButtonElement>('.replay')!;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ?t=3.5 freezes the choreography at a moment (for review and screenshots).
const frozenAt = new URLSearchParams(location.search).get('t');

declare global {
  interface Window { arrivalBooted?: boolean }
}
window.arrivalBooted = true; // tells the inline failsafe in index.html we're in charge

const scene = createScene(stage);
let frame = 0;

function rest() {
  cancelAnimationFrame(frame);
  scene.apply(REST);
  html.classList.remove('is-staged', 'is-moving');
  html.classList.add('is-resting');
  replay.hidden = reduceMotion.matches;
}

function play() {
  cancelAnimationFrame(frame);
  html.classList.remove('is-resting');
  const arrival = createArrival(scene.offstageHeight());
  scene.apply(arrival.pose(0));
  html.classList.remove('is-staged');
  html.classList.add('is-moving');
  replay.hidden = true;

  // Advance by real frame time, but cap each step: if the tab is hidden or the
  // main thread stalls, the arrival pauses instead of skipping ahead.
  let t = 0;
  let last = performance.now();
  const tick = (now: number) => {
    t += Math.min(now - last, 50) / 1000;
    last = now;
    if (t >= arrival.duration) return rest();
    scene.apply(arrival.pose(t));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

function start() {
  if (reduceMotion.matches) return rest();
  if (frozenAt !== null) {
    const arrival = createArrival(scene.offstageHeight());
    scene.apply(arrival.pose(Number(frozenAt) || 0));
    html.classList.remove('is-staged');
    return;
  }
  play();
}

scene.ready.then(start, rest);

replay.addEventListener('click', play);
reduceMotion.addEventListener('change', () => (reduceMotion.matches ? rest() : undefined));
