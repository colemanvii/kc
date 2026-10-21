import { defineConfig } from 'vite';

// The canonical drawing sits unmodified at the repository root. index.html
// references it directly (no-JS fallback), so Vite fingerprints and emits it
// byte-for-byte; the derived animation layers are served from public/.
export default defineConfig({
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
