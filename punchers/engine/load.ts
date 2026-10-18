// Loads an episode folder from disk (Node: tests, frame rendering, CI checks).
// The browser preview bundles the same JSON through Vite instead.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileEpisode, type EnvironmentSpec, type EpisodeSources, type EpisodeSpec, type PoseLibrary, type ShotSpec } from './episode.ts';
import type { RigSpec } from './rig.ts';

export const PUNCHERS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const json = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const dirs = (d: string) => readdirSync(path.join(PUNCHERS, d), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

export const listEpisodes = () => dirs('episodes').filter((d) => existsSync(path.join(PUNCHERS, 'episodes', d, 'episode.json')));

/** Every character rig, pose library and environment in the repository, keyed by folder name. */
export function readLibrary(): Omit<EpisodeSources, 'shots'> {
  const rigs: Record<string, RigSpec> = {};
  const poses: Record<string, PoseLibrary> = {};
  for (const c of dirs('characters')) {
    const rig = path.join(PUNCHERS, 'characters', c, 'rig.json');
    const lib = path.join(PUNCHERS, 'characters', c, 'poses.json');
    if (existsSync(rig)) rigs[c] = json<RigSpec>(rig);
    if (existsSync(lib)) poses[c] = json<PoseLibrary>(lib);
  }
  const environments: Record<string, EnvironmentSpec> = {};
  for (const e of dirs('environments')) environments[e] = json<EnvironmentSpec>(path.join(PUNCHERS, 'environments', e, 'environment.json'));
  return { rigs, poses, environments };
}

export function readEpisode(id: string) {
  const dir = path.join(PUNCHERS, 'episodes', id);
  const spec = json<EpisodeSpec>(path.join(dir, 'episode.json'));
  const shots: Record<string, ShotSpec> = {};
  for (const f of readdirSync(path.join(dir, 'shots'))) {
    if (f.endsWith('.json')) shots[f.replace(/\.json$/, '')] = json<ShotSpec>(path.join(dir, 'shots', f));
  }
  return { spec, sources: { shots, ...readLibrary() } };
}

export function loadEpisode(id: string, override?: (spec: EpisodeSpec) => EpisodeSpec) {
  const { spec, sources } = readEpisode(id);
  return compileEpisode(override ? override(spec) : spec, sources);
}
