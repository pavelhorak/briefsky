import { createConnection, createLongLivedTokenAuth, subscribeEntities, type Connection, type HassEntities } from 'home-assistant-js-websocket';
import { writable } from 'svelte/store';
import { loadConfiguration } from './Configuration';

export const entities = writable<HassEntities>({});
export const connection = writable<Connection | null>(null);

/**
 * Last usable state seen for each entity, with the timestamp it was observed.
 *
 * Home Assistant reports `unknown` for entities whose source has gone quiet rather than
 * changed — most notably a sleeping Tesla, which `tesla_fleet` deliberately does not wake
 * to poll. Blanking the tile in that case is wrong: the car's battery level, range and
 * cabin temperature are still whatever they were when it went to sleep.
 *
 * Only use this for slow-moving state. Instantaneous readings (power, current) must NOT
 * fall back to a retained value — a stale 5 kW is a lie, not a stale truth.
 */
export interface RetainedState {
  state: string;
  at: number;
}

/* Persisted, not just in-memory. The cache is learned by watching live updates, so on a
   cold load with the car ALREADY asleep there is nothing to fall back to and the tile
   renders blank — which is every load after a cache clear. Rehydrating from localStorage
   is what makes the fallback actually work in the case it exists for. */
const RETAINED_KEY = 'briefsky_last_known';

function loadRetained(): Record<string, RetainedState> {
  try {
    const raw = window.localStorage.getItem(RETAINED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RetainedState>) : {};
  } catch {
    return {};
  }
}

export const lastKnown = writable<Record<string, RetainedState>>(loadRetained());

/* Writes are throttled: entity updates arrive every few seconds and serialising the whole
   map on each one would be wasteful. Also flushed on hide, so a backgrounded tablet keeps
   whatever it learned. */
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let pending: Record<string, RetainedState> | null = null;

function flushRetained() {
  persistTimer = undefined;
  if (!pending) return;
  try {
    window.localStorage.setItem(RETAINED_KEY, JSON.stringify(pending));
  } catch {
    /* quota exceeded or storage disabled — the in-memory cache still works this session */
  }
  pending = null;
}

function schedulePersist(map: Record<string, RetainedState>) {
  pending = map;
  if (persistTimer) return;
  persistTimer = setTimeout(flushRetained, 20000);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushRetained();
  });
  window.addEventListener('pagehide', flushRetained);
}

export function isUsableState(state: string | undefined | null): boolean {
  return !!state && state !== 'unknown' && state !== 'unavailable';
}

/** Live state if usable, otherwise the last usable one. Returns '' when neither exists. */
export function retained($entities: HassEntities, $lastKnown: Record<string, RetainedState>, id: string): { state: string; stale: boolean; at: number | null } {
  const live = $entities[id]?.state;
  if (isUsableState(live)) return { state: live as string, stale: false, at: null };
  const prev = $lastKnown[id];
  if (prev) return { state: prev.state, stale: true, at: prev.at };
  return { state: '', stale: false, at: null };
}

let conn: Connection | null = null;

export async function connect(url: string, token: string) {
  if (conn) {
    conn.close();
  }

  if (!url || !token) return;

  const cleanUrl = url.replace(/\/$/, '');
  try {
    const auth = createLongLivedTokenAuth(cleanUrl, token);
    conn = await createConnection({ auth });
    connection.set(conn);

    subscribeEntities(conn, (hassEntities) => {
      entities.set(hassEntities);
      lastKnown.update((prev) => {
        let next = prev;
        for (const id of Object.keys(hassEntities)) {
          const state = hassEntities[id]?.state;
          if (!isUsableState(state) || prev[id]?.state === state) continue;
          if (next === prev) next = { ...prev };
          next[id] = { state: state as string, at: Date.now() };
        }
        if (next !== prev) schedulePersist(next);
        return next;
      });
    });

    conn.addEventListener('disconnected', () => {
      connection.set(null);
    });
  } catch (err) {
    console.error('HA Connection: FAILED', err);
    connection.set(null);
  }
}

/**
 * Seed the retained cache from Home Assistant's own history.
 *
 * Covers the cold-start case that localStorage cannot: a brand new browser (or one whose
 * cache was just cleared) has learned nothing, so if the car is already asleep the tile
 * would stay blank until it next wakes — potentially hours. HA still knows what the values
 * were, so ask it once on connect. Never overwrites a fresher live value.
 */
export async function seedRetainedFromHistory(entityIds: string[], hoursBack = 48) {
  const ids = entityIds.filter(Boolean);
  if (!ids.length) return;
  try {
    const end = new Date();
    const start = new Date(end.getTime() - hoursBack * 3600_000);
    const raw = (await fetchHistory(ids, start, end)) as Array<Array<{ entity_id: string; state: string; last_changed: string }>>;
    if (!Array.isArray(raw)) return;

    lastKnown.update((prev) => {
      let next = prev;
      for (const series of raw) {
        if (!Array.isArray(series)) continue;
        /* Walk backwards to the most recent usable reading in the window. */
        for (let i = series.length - 1; i >= 0; i--) {
          const row = series[i];
          if (!row?.entity_id || !isUsableState(row.state)) continue;
          const at = Date.parse(row.last_changed);
          const stamp = Number.isFinite(at) ? at : Date.now();
          if (!prev[row.entity_id] || prev[row.entity_id].at < stamp) {
            if (next === prev) next = { ...prev };
            next[row.entity_id] = { state: row.state, at: stamp };
          }
          break;
        }
      }
      if (next !== prev) schedulePersist(next);
      return next;
    });
  } catch (err) {
    console.warn('briefsky: could not seed retained state from history', err);
  }
}

export async function callService(domain: string, service: string, serviceData: Record<string, unknown> = {}) {
  if (!conn) return;
  await conn.sendMessagePromise({
    type: 'call_service',
    domain,
    service,
    service_data: serviceData,
  });
}

export interface StatisticsRow {
  start: string;
  end: string;
  mean?: number;
  min?: number;
  max?: number;
  sum?: number;
  state?: number;
  last_reset?: string;
  change?: number;
}

export async function fetchStatistics(
  entityIds: string[],
  startTime: Date,
  endTime: Date,
  period: '5minute' | 'hour' | 'day' | 'week' | 'month' = 'hour',
): Promise<Record<string, StatisticsRow[]>> {
  if (!conn) {
    throw new Error('Home Assistant WebSocket is not connected');
  }
  return await conn.sendMessagePromise<Record<string, StatisticsRow[]>>({
    type: 'recorder/statistics_during_period',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    statistic_ids: entityIds,
    period,
    types: ['mean', 'change', 'state'],
  });
}

/**
 * Fetch history using REST API (standard GET request)
 * Matches successful curl command format:
 * /api/history/period/YYYY-MM-DDTHH:mm:ssZ?filter_entity_id=...&end_time=YYYY-MM-DDTHH:mm:ssZ
 */
export async function fetchHistory(entityIds: string[], startTime: Date, endTime: Date): Promise<unknown> {
  const config = loadConfiguration();
  const url = config.haUrl.replace(/\/$/, '');
  const token = config.haToken;

  if (!url || !token) {
    throw new Error('Home Assistant URL or Token is not configured');
  }

  // Format exactly as in your successful curl example: YYYY-MM-DDTHH:mm:ssZ
  const formatDate = (date: Date) => date.toISOString().split('.')[0] + 'Z';
  const startStr = formatDate(startTime);
  const endStr = formatDate(endTime);

  // Construct URL following your curl example exactly
  const endpoint = `${url}/api/history/period/${startStr}?filter_entity_id=${entityIds.join(',')}&end_time=${endStr}`;

  console.log(`HA REST History Request: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown Error'}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`HA REST History Failed:`, err);
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('CORS Error: Add this origin to cors_allowed_origins in HA configuration.yaml');
    }
    throw err;
  }
}
