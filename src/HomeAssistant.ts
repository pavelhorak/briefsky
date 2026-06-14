import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  type Connection,
  type HassEntities
} from 'home-assistant-js-websocket';
import { writable } from 'svelte/store';
import { loadConfiguration } from './Configuration';

export const entities = writable<HassEntities>({});
export const connection = writable<Connection | null>(null);

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
    });

    conn.addEventListener('disconnected', () => {
      connection.set(null);
    });
  } catch (err) {
    console.error('HA Connection: FAILED', err);
    connection.set(null);
  }
}

export async function callService(domain: string, service: string, serviceData: Record<string, unknown> = {}) {
  if (!conn) return;
  await conn.sendMessagePromise({
    type: 'call_service',
    domain,
    service,
    service_data: serviceData
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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