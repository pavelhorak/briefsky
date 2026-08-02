/**
 * Silent auto-update.
 *
 * Home Assistant serves /local/ with `Cache-Control: public, max-age=2678400` (31 days),
 * and the deploy script renames the service worker on every deploy (sw74 -> sw75) to bust
 * the Cloudflare CDN cache. Together those defeat both normal update paths:
 *
 *   - `registerType: 'autoUpdate'` polls the service worker URL it *registered*. That file
 *     still exists and is unchanged, so the browser never learns sw75 exists.
 *   - A plain reload is answered by the old service worker from its own precache, so the
 *     network is never consulted.
 *
 * So we sidestep both layers: fetch a tiny version.json with `cache: 'no-store'` (bypasses
 * the HTTP cache) that is excluded from the precache manifest (so the service worker does
 * not answer it). If the build id differs from the one compiled into this bundle, tear the
 * service worker down, drop every cache, and reload.
 */

const APPLIED_KEY = 'briefsky_applied_build';
const BUST_PARAM = '_v';

/** Strip the cache-busting param the reload added, so it does not linger in a shared URL. */
export function cleanUpdateParam() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(BUST_PARAM)) return;
    url.searchParams.delete(BUST_PARAM);
    window.history.replaceState(null, '', url.toString());
  } catch {
    /* history API unavailable — harmless, the param is inert */
  }
}

/**
 * Tear down the service worker and every cache, then reload in a way that actually
 * refetches index.html.
 *
 * The reload MUST change the URL. Home Assistant serves index.html with a 31-day
 * max-age, and a plain `location.reload()` can be answered from the browser's HTTP
 * cache — so the page comes back pointing at the same stale bundle and nothing appears
 * to have happened. Adding an unseen query param forces a genuine fetch.
 *
 * Shared by the auto-updater and the Settings "Clear Cache" button so they cannot drift.
 */
export async function hardReload() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* no service worker support, or already gone */
  }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    /* Cache Storage unavailable */
  }

  /* Preserve existing query params — briefsky keeps its configuration in the URL, so
     replacing the querystring outright would wipe the user's settings. */
  const url = new URL(window.location.href);
  url.searchParams.set(BUST_PARAM, Date.now().toString(36));
  window.location.replace(url.toString());
}

/**
 * Check once for a newer deploy and swap to it. Safe to call repeatedly; it never reloads
 * twice for the same build id, so a bad deploy cannot trap the app in a reload loop.
 */
export async function checkForUpdate(): Promise<void> {
  const current = window.__APP_BUILD_ID__;
  if (!current) return;

  let remoteId: string | undefined;
  try {
    const res = await fetch(`version.json?t=${Date.now().toString(36)}`, { cache: 'no-store' });
    if (!res.ok) return;
    remoteId = (await res.json())?.buildId;
  } catch {
    return; /* offline or file missing — keep running the current build */
  }

  if (!remoteId || remoteId === current) return;

  try {
    if (window.sessionStorage.getItem(APPLIED_KEY) === remoteId) return;
    window.sessionStorage.setItem(APPLIED_KEY, remoteId);
  } catch {
    /* private mode / storage disabled: proceed, the build-id equality check still guards */
  }

  console.info(`briefsky: new build ${remoteId} available (running ${current}) — updating`);
  await hardReload();
}

/**
 * Check on startup and whenever the dashboard comes back to the foreground. The tablet
 * running this is usually left on for weeks, so foreground checks are what actually
 * deliver updates; the throttle keeps that from hammering the server.
 */
export function startAutoUpdate(minIntervalMs = 15 * 60 * 1000) {
  cleanUpdateParam();

  let last = 0;
  const run = () => {
    const now = Date.now();
    if (now - last < minIntervalMs) return;
    last = now;
    void checkForUpdate();
  };

  run();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });
  window.addEventListener('focus', run);
}
