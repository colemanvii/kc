import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// PUNCHERS proof player: isolated from The Arrival site. Its own root
// (punchers/proof); the repository's public/ is shared read-only so the rig
// draws Jim's derived layers from the one place they live.
export default defineConfig({
  root: fileURLToPath(new URL('./proof', import.meta.url)),
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
  build: { outDir: fileURLToPath(new URL('../.scratch/punchers-proof', import.meta.url)), emptyOutDir: true, target: 'es2020', assetsInlineLimit: 0 },
});
