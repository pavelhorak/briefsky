import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

import * as child_process from 'child_process';

/* Get commit id */
let commitId: string;
try {
  commitId = child_process.execSync('git rev-parse --short HEAD 2>/dev/null').toString();
} catch {
  commitId = 'unknown';
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  define: {
    'window.__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    'window.__APP_COMMIT_ID__': JSON.stringify(commitId),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Briefsky',
        short_name: 'Briefsky',
        description: 'A privacy-focused Home Automation Dashboard and Weather Station.',
        theme_color: '#f9fafb',
        background_color: '#f9fafb',
        display: 'fullscreen',
        orientation: 'any',
        start_url: 'index.html?storage=local',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
