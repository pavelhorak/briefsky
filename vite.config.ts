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

/* Unique per build. Deliberately NOT the commit id: briefsky is often deployed with
   uncommitted changes, so the commit would stay identical across two deploys and the
   auto-updater would never notice the second one. */
const buildId = `${process.env.npm_package_version ?? '0'}-${Date.now().toString(36)}`;

/* Emits version.json alongside the bundle. The running app fetches this with
   `cache: 'no-store'` to discover new deploys — see src/AutoUpdate.ts. It must stay OUT
   of the Workbox precache, or the service worker would answer from cache and the check
   could never see a new build. Vite PWA's default globPatterns cover
   js/css/html/ico/png/svg only, so .json is already excluded; globIgnores below makes
   that explicit so a future glob change can't silently break the updater. */
function emitVersionFile() {
  return {
    name: 'briefsky-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset' as const,
        fileName: 'version.json',
        source: JSON.stringify({ buildId, version: process.env.npm_package_version, commit: commitId.trim() }),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  define: {
    'window.__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    'window.__APP_COMMIT_ID__': JSON.stringify(commitId),
    'window.__APP_BUILD_ID__': JSON.stringify(buildId),
  },
  plugins: [
    svelte(),
    emitVersionFile(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png'],
      workbox: {
        globIgnores: ['**/version.json'],
      },
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
