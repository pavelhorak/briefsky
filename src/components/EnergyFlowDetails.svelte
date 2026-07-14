<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getContext, onMount } from 'svelte';
  import { configuration } from '../Configuration';
  import { entities } from '../HomeAssistant';
  import { consumptionEntityId, gridEntityId } from '../EnergyState';
  import { formatEnergy, formatKilowattHours } from '../Formatting';
  import { virtualBattery, refreshVirtualBattery } from '../VirtualBattery';
  import EnergyFlowDiagram from './EnergyFlowDiagram.svelte';
  import SensorHistoryChart from './SensorHistoryChart.svelte';

  const closeOverlay = getContext<() => void>('overlay-close');

  onMount(() => {
    refreshVirtualBattery();
  });

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  $: ids = $configuration.entityIds;

  function num(state: string | undefined): number | null {
    if (state == null) return null;
    const v = parseFloat(state);
    return Number.isFinite(v) ? v : null;
  }

  function attr(id: string, key: string): string | undefined {
    return $entities[id]?.attributes?.[key];
  }

  $: pv1 = num($entities[ids.pv1Power]?.state);
  $: pv2 = num($entities[ids.pv2Power]?.state);
  $: loadL1 = num($entities[ids.loadL1Power]?.state);
  $: loadL2 = num($entities[ids.loadL2Power]?.state);
  $: loadL3 = num($entities[ids.loadL3Power]?.state);

  $: todaySolar = num($entities[ids.todaySolarProduction]?.state);
  $: todayCharge = num($entities[ids.todayBatteryCharge]?.state);
  $: todayDischarge = num($entities[ids.todayBatteryDischarge]?.state);
  $: todayImport = num($entities[ids.todayGridImport]?.state);
  $: todayExport = num($entities[ids.todayGridExport]?.state);
  $: todayLoad = num($entities[ids.todayLoad]?.state);

  $: batteryTemp = num($entities[ids.batteryTemp]?.state);
  $: batterySoh = num($entities[ids.batterySoh]?.state);
  $: batteryCapacity = $entities[ids.batteryCapacity]?.state;

  function kwh(v: number | null): string {
    if (v == null) return '--';
    return v.toFixed(1);
  }

  function w(v: number | null): string {
    if (v == null) return '--';
    return formatEnergy(v).value + ' ' + formatEnergy(v).unit;
  }

  /* 24h chart config — re-uses the existing SolarDetails chart configuration. */
  $: chartEntities = [
    { id: ids.solarPower, label: 'Solar',       color: 'stroke-yellow-400', fill: 'fill-yellow-400', swatch: 'bg-yellow-400', type: 'line' as const, abs: true },
    { id: $consumptionEntityId, label: 'Home',  color: 'stroke-blue-500',   fill: 'fill-blue-500',   swatch: 'bg-blue-500',   type: 'line' as const, abs: true },
    { id: $gridEntityId,        label: 'Grid',  color: 'stroke-purple-500', fill: 'fill-purple-500', swatch: 'bg-purple-500', type: 'bar'  as const, abs: true },
  ];
  let chartKey = 0;
  $: if ($consumptionEntityId || $gridEntityId) chartKey++;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={(e: Event) => e.stopPropagation()}
     class="cursor-default max-w-6xl mx-auto px-4 md:px-8 pt-2 pb-4 md:pb-6 text-gray-800 dark:text-gray-50">

  <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
    <!-- Flow diagram card (left, contains the title + close button) -->
    <div class="lg:col-span-3 bg-white dark:bg-gray-900 rounded-3xl p-4 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
      <div class="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onclick={closeOverlay} class="rounded-full p-2 -m-2 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all" aria-label="Close">
          <Icon icon="mdi:home-lightning-bolt" class="text-4xl md:text-5xl" />
        </button>
        <h1 class="text-2xl md:text-3xl font-bold">Energy Flow</h1>
      </div>
      <div class="flex-1 flex items-center justify-center min-h-0">
        <div class="w-full max-w-[460px] mx-auto">
          <EnergyFlowDiagram />
        </div>
      </div>
    </div>

    <!-- Stats cards (right) -->
    <div class="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
      <!-- Solar -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-3 md:p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <Icon icon="mdi:solar-power-variant" class="text-2xl text-amber-500 dark:text-amber-300" />
          <span class="font-semibold text-sm md:text-base">Solar</span>
        </div>
        <div class="text-2xl md:text-3xl font-bold">{kwh(todaySolar)}<span class="text-sm md:text-base opacity-60 ml-1">kWh</span></div>
        <div class="text-[11px] md:text-xs opacity-60 uppercase tracking-wide mb-2">Today</div>
        <div class="space-y-0.5 text-xs md:text-sm">
          <div class="flex justify-between"><span class="opacity-70">PV1</span><span>{w(pv1)}</span></div>
          <div class="flex justify-between"><span class="opacity-70">PV2</span><span>{w(pv2)}</span></div>
        </div>
      </div>

      <!-- Battery -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-3 md:p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <Icon icon="mdi:battery" class="text-2xl text-emerald-500 dark:text-emerald-300" />
          <span class="font-semibold text-sm md:text-base">Battery</span>
        </div>
        <div class="text-2xl md:text-3xl font-bold">{kwh(todayDischarge)}<span class="text-sm md:text-base opacity-60 ml-1">kWh</span></div>
        <div class="text-[11px] md:text-xs opacity-60 uppercase tracking-wide mb-2">Discharged</div>
        <div class="space-y-0.5 text-xs md:text-sm">
          <div class="flex justify-between"><span class="opacity-70">Charged</span><span>{kwh(todayCharge)} kWh</span></div>
          <div class="flex justify-between"><span class="opacity-70">SOH</span><span>{batterySoh == null ? '--' : batterySoh.toFixed(1) + '%'}</span></div>
          <div class="flex justify-between"><span class="opacity-70">Temp</span><span>{batteryTemp == null ? '--' : batteryTemp.toFixed(1) + '°C'}</span></div>
          <div class="flex justify-between"><span class="opacity-70">Capacity</span><span>{batteryCapacity ?? '--'} {attr(ids.batteryCapacity,'unit_of_measurement') ?? 'kWh'}</span></div>
        </div>
      </div>

      <!-- Grid -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-3 md:p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <Icon icon="mdi:transmission-tower" class="text-2xl text-sky-500 dark:text-sky-300" />
          <span class="font-semibold text-sm md:text-base">Grid</span>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div class="text-lg md:text-xl font-bold">{kwh(todayImport)}<span class="text-xs opacity-60 ml-1">kWh</span></div>
            <div class="text-[10px] md:text-xs opacity-60 uppercase">Import</div>
          </div>
          <div>
            <div class="text-lg md:text-xl font-bold">{kwh(todayExport)}<span class="text-xs opacity-60 ml-1">kWh</span></div>
            <div class="text-[10px] md:text-xs opacity-60 uppercase">Export</div>
          </div>
        </div>
      </div>

      <!-- Home -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-3 md:p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-2">
          <Icon icon="mdi:home" class="text-2xl text-gray-700 dark:text-gray-200" />
          <span class="font-semibold text-sm md:text-base">Home</span>
        </div>
        <div class="text-2xl md:text-3xl font-bold">{kwh(todayLoad)}<span class="text-sm md:text-base opacity-60 ml-1">kWh</span></div>
        <div class="text-[11px] md:text-xs opacity-60 uppercase tracking-wide mb-2">Today</div>
        <div class="space-y-0.5 text-xs md:text-sm">
          <div class="flex justify-between"><span class="opacity-70">L1</span><span>{w(loadL1)}</span></div>
          <div class="flex justify-between"><span class="opacity-70">L2</span><span>{w(loadL2)}</span></div>
          <div class="flex justify-between"><span class="opacity-70">L3</span><span>{w(loadL3)}</span></div>
        </div>
      </div>

      <!-- Virtual battery: net-metering balance at the utility, monthly flows reset each calendar month -->
      <div class="col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-3 md:p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:battery-plus-variant" class="text-2xl text-violet-500 dark:text-violet-300" />
            <span class="font-semibold text-sm md:text-base">Virtual Battery</span>
          </div>
          <span class="text-[10px] md:text-xs opacity-60 uppercase">since {$configuration.vbSeedDate}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 mt-1">
          <div>
            <div class="text-2xl md:text-3xl font-bold">{formatKilowattHours($virtualBattery.balance)}<span class="text-xs opacity-60 ml-1">kWh</span></div>
            <div class="text-[10px] md:text-xs opacity-60 uppercase">Balance</div>
          </div>
          <div>
            <div class="text-lg md:text-xl font-bold">{formatKilowattHours($virtualBattery.monthExport)}<span class="text-xs opacity-60 ml-1">kWh</span></div>
            <div class="text-[10px] md:text-xs opacity-60 uppercase">Stored ({monthName})</div>
          </div>
          <div>
            <div class="text-lg md:text-xl font-bold">{formatKilowattHours($virtualBattery.monthImport)}<span class="text-xs opacity-60 ml-1">kWh</span></div>
            <div class="text-[10px] md:text-xs opacity-60 uppercase">Used ({monthName})</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 24h chart -->
  <div class="mt-4 md:mt-6 bg-white dark:bg-gray-900 rounded-3xl p-4 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
    <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3 text-sm md:text-base">
      {#each chartEntities as e}
        <div class="flex items-center gap-2">
          <span class="inline-block w-4 h-4 rounded-full {e.swatch}"></span>
          <span class="text-gray-700 dark:text-gray-200">{e.label}</span>
        </div>
      {/each}
    </div>
    {#key chartKey}
      <SensorHistoryChart
        title="24h Production vs Consumption"
        entities={chartEntities}
        height={240}
        valueFormatter={(v) => formatEnergy(v).value}
        unit=""
      />
    {/key}
  </div>
</div>
