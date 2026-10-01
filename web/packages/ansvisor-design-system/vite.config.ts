import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { buildTokens } from './scripts/build-tokens.mjs';

function designTokensPlugin(): Plugin {
  const file = path.resolve(import.meta.dirname, 'tokens.json');
  return {
    name: 'design-tokens',
    buildStart() {
      buildTokens();
      this.addWatchFile(file);
    },
    configureServer(server) {
      server.watcher.add(file);
      server.watcher.on('change', changed => {
        if (path.resolve(changed) === file) {
          buildTokens();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [designTokensPlugin(), react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { host: '0.0.0.0', port: Number(process.env.PORT || 5173) },
});
