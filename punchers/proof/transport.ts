// Transport: the audio clock is the master clock. Picture is a function of the
// AudioContext's clock, never of frame counting, so it cannot drift from the song.
//
//   song time = anchorSong + (heard − anchorCtx)
//   heard     = ctx.currentTime − output latency   (what is reaching the speakers)
//
// Every play/resume/seek re-anchors: the stem is started at exactly `anchorCtx`
// from `anchorSong + offset` into the recording, and every click is scheduled at
// `anchorCtx + (beatTime − anchorSong)`. Picture, stem and click therefore share one
// equation and stay locked through any number of seeks, pauses and resumes.
//
// With no song in the repository yet, the clock still runs and a quiet click is
// scheduled from the tempo map. When `episode.audio.src` is set, the stem plays on
// the same clock.

import type { TempoMap } from '../engine/tempo.ts';

export interface Transport {
  readonly playing: boolean;
  time(): number;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): Promise<void>;
  setClick(on: boolean): void;
  /** Call once per animation frame while playing: schedules the next clicks. */
  pump(): void;
}

/** The slice of AudioContext the transport uses (so tests can drive a fake clock). */
export interface AudioClock {
  readonly currentTime: number;
  readonly outputLatency?: number;
  readonly baseLatency?: number;
  readonly destination: AudioNode;
  resume(): Promise<void>;
  createGain(): GainNode;
  createOscillator(): OscillatorNode;
  createBufferSource(): AudioBufferSourceNode;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>;
}

const LOOKAHEAD = 0.2; // s
const HEADROOM = 0.05; // s between pressing play and the first sample, so nothing starts late

export function createTransport(
  tempo: TempoMap,
  duration: number,
  stemUrl: string | null,
  stemOffset = 0,
  makeClock: () => AudioClock = () => new AudioContext({ latencyHint: 'interactive' }),
  fetchStem: (url: string) => Promise<ArrayBuffer> = (u) => fetch(u).then((r) => r.arrayBuffer()),
): Transport {
  let ctx: AudioClock | null = null;
  let clickBus: GainNode | null = null;
  let stem: AudioBuffer | null = null;
  let stemNode: AudioBufferSourceNode | null = null;
  let playing = false;
  let anchorCtx = 0; // context time at which `anchorSong` reaches the speakers
  let anchorSong = 0;
  let paused = 0;
  let nextBeat = 0;
  let clickOn = true;

  const newBus = () => {
    clickBus = ctx!.createGain();
    clickBus.gain.value = clickOn ? 1 : 0;
    clickBus.connect(ctx!.destination);
  };

  const ensure = async () => {
    if (ctx) return ctx;
    ctx = makeClock();
    newBus();
    if (stemUrl) stem = await ctx.decodeAudioData(await fetchStem(stemUrl));
    return ctx;
  };

  const latency = () => (ctx ? ctx.outputLatency || ctx.baseLatency || 0 : 0);

  // Never earlier than the anchor: during the headroom after a resume the picture
  // holds on the resume frame instead of stepping back.
  const time = () =>
    playing && ctx ? Math.min(duration, anchorSong + Math.max(0, ctx.currentTime - latency() - anchorCtx)) : paused;

  const click = (at: number, downbeat: boolean) => {
    const c = ctx!;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.frequency.value = downbeat ? 1760 : 1320;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(downbeat ? 0.16 : 0.08, at + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
    osc.connect(env).connect(clickBus!);
    osc.start(at);
    osc.stop(at + 0.06);
  };

  const transport: Transport = {
    get playing() { return playing; },
    time,
    async play() {
      if (playing) return;
      const c = await ensure();
      await c.resume();
      if (paused >= duration) paused = 0;
      anchorSong = paused;
      // Scheduled sounds leave the speakers `latency` after their context time, so
      // they are scheduled at anchorCtx − latency; the picture subtracts the same.
      anchorCtx = c.currentTime + HEADROOM + latency();
      nextBeat = Math.ceil(tempo.beatAt(anchorSong) - 1e-9);
      if (stem) {
        stemNode = c.createBufferSource();
        stemNode.buffer = stem;
        stemNode.connect(c.destination);
        stemNode.start(anchorCtx - latency(), anchorSong + stemOffset);
      }
      playing = true;
    },
    pause() {
      if (!playing) return;
      paused = time();
      playing = false;
      stemNode?.stop();
      stemNode = null;
      // Clicks already scheduled past the pause are dropped with their bus.
      if (ctx && clickBus) {
        clickBus.disconnect();
        newBus();
      }
    },
    async seek(s) {
      const wasPlaying = playing;
      transport.pause();
      paused = Math.max(0, Math.min(duration, s));
      if (wasPlaying) await transport.play();
    },
    setClick(on) {
      clickOn = on;
      if (clickBus && ctx) clickBus.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.01);
    },
    pump() {
      if (!playing || !ctx) return;
      const horizon = time() + LOOKAHEAD;
      for (;;) {
        const s = tempo.secondsAt(nextBeat);
        if (s > horizon || s > duration) break;
        if (s >= anchorSong) click(anchorCtx - latency() + (s - anchorSong), nextBeat % tempo.beatsPerBar === 0);
        nextBeat++;
      }
    },
  };
  return transport;
}
