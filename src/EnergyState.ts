import { derived } from 'svelte/store';
import { entities } from './HomeAssistant';
import { configuration } from './Configuration';

function isUnusable(state: string | undefined): boolean {
  return !state || state === '0' || state === 'unknown' || state === 'unavailable' || isNaN(parseFloat(state));
}

function num(state: string | undefined): number {
  const v = parseFloat(state ?? '');
  return Number.isFinite(v) ? v : 0;
}

export const isBackupMode = derived([entities, configuration], ([$entities, $configuration]) => {
  return isUnusable($entities[$configuration.entityIds.loadPower]?.state);
});

export const consumptionEntityId = derived([isBackupMode, configuration], ([$backup, $configuration]) =>
  $backup ? $configuration.entityIds.backupMeter : $configuration.entityIds.loadPower
);

export const gridEntityId = derived([isBackupMode, configuration], ([$backup, $configuration]) =>
  $backup ? $configuration.entityIds.backupMeter : $configuration.entityIds.gridPower
);

export const solarWatts = derived([entities, configuration], ([$entities, $configuration]) =>
  num($entities[$configuration.entityIds.solarPower]?.state)
);

export const consumptionWatts = derived([entities, consumptionEntityId], ([$entities, $id]) => num($entities[$id]?.state));

export const gridWatts = derived([entities, gridEntityId], ([$entities, $id]) => num($entities[$id]?.state));

export const gridIcon = derived([isBackupMode, gridWatts], ([$backup, $grid]) => {
  if ($backup) return 'mdi:power-from-grid';
  return $grid > 0 ? 'mdi:power-from-grid' : 'mdi:power-to-grid';
});

/* PV (DC, direct from panels) — preferred for "solar production" in the flow diagram */
export const pvWatts = derived([entities, configuration], ([$entities, $configuration]) =>
  num($entities[$configuration.entityIds.pvPower]?.state)
);

/* Battery */
export const batterySoc = derived([entities, configuration], ([$entities, $configuration]) =>
  num($entities[$configuration.entityIds.batterySoc]?.state)
);

/* Battery power magnitude (W). Charging or discharging — sign convention varies, so we
   rely on batteryState for direction and use absolute value for magnitude. */
export const batteryWatts = derived([entities, configuration], ([$entities, $configuration]) =>
  Math.abs(num($entities[$configuration.entityIds.batteryPower]?.state))
);

export const batteryState = derived([entities, configuration], ([$entities, $configuration]) => {
  const s = ($entities[$configuration.entityIds.batteryState]?.state || '').toLowerCase();
  if (s.startsWith('charg')) return 'charging' as const;
  if (s.startsWith('disch')) return 'discharging' as const;
  return 'idle' as const;
});

export const isBatteryCharging = derived(batteryState, ($s) => $s === 'charging');
export const isBatteryDischarging = derived(batteryState, ($s) => $s === 'discharging');

/* Grid direction: positive watts → importing FROM grid (per existing gridIcon logic). */
export const isGridImporting = derived(gridWatts, ($g) => $g > 0);
