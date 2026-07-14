import { writable, get } from 'svelte/store';

import { connection, entities, fetchStatistics } from './HomeAssistant';
import { loadConfiguration } from './Configuration';

/**
 * Virtual battery (utility net-metering account) tracking.
 *
 * The distributor keeps a running balance: balance = previous balance + grid export - grid import,
 * settled per calendar month. We reproduce it from the inverter's cumulative grid meters via HA
 * long-term statistics (monthly change), seeded with the balance from the latest utility statement.
 * Validated against the June 2026 statement: inverter meters read ~1-2% above the distribution
 * meter, leaving the computed balance within ~0.5% after a full month.
 */

export interface VirtualBatteryState {
  /** Current balance in kWh (seed balance + export - import since seed date) */
  balance: number | null;
  /** kWh sent to the grid this calendar month */
  monthExport: number | null;
  /** kWh drawn from the grid this calendar month */
  monthImport: number | null;
  /** monthExport - monthImport; resets each calendar month */
  monthNet: number | null;
  updatedAt: Date | null;
}

const EMPTY: VirtualBatteryState = { balance: null, monthExport: null, monthImport: null, monthNet: null, updatedAt: null };

export const virtualBattery = writable<VirtualBatteryState>(EMPTY);

/** Parse 'YYYY-MM-DD' as local midnight (Date.parse would give UTC midnight) */
function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

let refreshing = false;

export async function refreshVirtualBattery(): Promise<void> {
  if (refreshing || !get(connection)) return;
  refreshing = true;
  try {
    const config = loadConfiguration();
    const importId = config.entityIds.totalGridImport;
    const exportId = config.entityIds.totalGridExport;
    const seedStart = parseLocalDate(config.vbSeedDate);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const queryStart = seedStart < monthStart ? seedStart : monthStart;

    const stats = await fetchStatistics([importId, exportId], queryStart, now, 'month');
    if (!stats[importId]?.length && !stats[exportId]?.length) {
      virtualBattery.set(EMPTY);
      return;
    }

    const tally = (entityId: string) => {
      let sinceSeed = 0;
      let thisMonth = 0;
      const rows = stats[entityId] ?? [];
      for (const row of rows) {
        const change = row.change ?? 0;
        const rowStart = new Date(row.start);
        if (rowStart >= seedStart) sinceSeed += change;
        if (rowStart >= monthStart) thisMonth += change;
      }
      // Long-term statistics are compiled hourly; top up with the live cumulative meter reading
      const lastState = rows.length ? rows[rows.length - 1].state : undefined;
      const live = parseFloat(get(entities)[entityId]?.state ?? '');
      const topUp = lastState !== null && lastState !== undefined && Number.isFinite(live) && live > lastState ? live - lastState : 0;
      return { sinceSeed: sinceSeed + topUp, thisMonth: thisMonth + topUp };
    };

    const imported = tally(importId);
    const exported = tally(exportId);

    virtualBattery.set({
      balance: config.vbSeedBalance + exported.sinceSeed - imported.sinceSeed,
      monthExport: exported.thisMonth,
      monthImport: imported.thisMonth,
      monthNet: exported.thisMonth - imported.thisMonth,
      updatedAt: now,
    });
  } catch (err) {
    console.error('Virtual battery refresh failed', err);
  } finally {
    refreshing = false;
  }
}

/* Refresh whenever HA (re)connects, then every 5 minutes while the app is open */
connection.subscribe((conn) => {
  if (conn) void refreshVirtualBattery();
});
if (typeof window !== 'undefined') {
  setInterval(() => void refreshVirtualBattery(), 5 * 60 * 1000);
}
