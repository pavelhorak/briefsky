<script lang="ts">
  import { entities, callService } from '../HomeAssistant';
  import { configuration } from '../Configuration';
  import Icon from '@iconify/svelte';
  import { Button, Toggle } from 'flowbite-svelte';
  import { formatTemperature } from '../Formatting';
  import { getContext } from 'svelte';

  const closeOverlay = getContext<() => void>('overlay-close');

  $: ids = $configuration.entityIds;
  $: climate = $entities[ids.hvacClimate];
  $: fireplace = $entities[ids.fireplaceSwitch];

  function num(id: string, fallback = NaN): number {
    const v = parseFloat($entities[id]?.state ?? '');
    return Number.isFinite(v) ? v : fallback;
  }
  function str(id: string): string {
    return $entities[id]?.state ?? '';
  }

  $: setpoint = num(ids.scheduleSetpoint);
  $: nextSetpoint = num(ids.scheduleNextSetpoint);
  $: nextSetpointTimeStr = str(ids.scheduleNextSetpointTime);

  $: hvacActive = str(ids.hvacActive) === 'on';
  $: dhwActive = str(ids.dhwActive) === 'on';
  $: dhwStatusText = str(ids.dhwStatus);
  $: dhwTemp = num(ids.dhwTemp);
  $: pressure = num(ids.waterPressure);
  $: pressureUnit = $entities[ids.waterPressure]?.attributes?.unit_of_measurement || 'bar';

  function formatNextTime(iso: string): string {
    if (!iso || iso === 'unknown' || iso === 'unavailable') return '--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--';
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (sameDay) return `today ${time}`;
    if (isTomorrow) return `tomorrow ${time}`;
    return d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + time;
  }

  async function setTemperature(temp: number) {
    await callService('climate', 'set_temperature', {
      entity_id: ids.hvacClimate,
      temperature: temp
    });
  }
  async function toggleFireplace() {
    await callService('switch', 'toggle', { entity_id: ids.fireplaceSwitch });
  }

  $: pressureWarn = !isNaN(pressure) && (pressure < 1.0 || pressure > 2.5);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={(e) => e.stopPropagation()} class="cursor-default max-w-6xl mx-auto px-4 md:px-8 pt-2 pb-4 md:pb-8 text-gray-800 dark:text-gray-50">

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

    <!-- 1. Heating (with page title integrated) -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 md:col-span-2">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-3 flex-wrap">
        <button onclick={closeOverlay} class="rounded-full p-1 -m-1 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all" aria-label="Close">
          <Icon icon="mdi:home-thermometer" class="text-3xl text-gray-800 dark:text-gray-50" />
        </button>
        <span>Heating</span>
        <span class="text-sm font-medium px-3 py-1 rounded-full {hvacActive ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200' : 'bg-gray-100 dark:bg-gray-700 opacity-60'}">
          {hvacActive ? 'Heating' : 'Idle'}
        </span>
        {#if climate?.state}
          <span class="text-sm font-medium opacity-60 uppercase ml-auto">{climate.state}</span>
        {/if}
      </h2>

      {#if climate}
        <div class="flex items-center justify-around mb-4 gap-4">
          <div class="text-center">
            <div class="text-xs uppercase opacity-60 font-bold">Current</div>
            <div class="text-5xl font-light">{formatTemperature(climate.attributes.current_temperature)}°</div>
          </div>
          <Icon icon={hvacActive ? 'mdi:fire' : 'mdi:fire-off'} class="text-4xl {hvacActive ? 'text-amber-500' : 'opacity-40'}" />
          <div class="text-center">
            <div class="text-xs uppercase opacity-60 font-bold">Target</div>
            <div class="text-5xl font-light">{formatTemperature(climate.attributes.temperature)}°</div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-4 mb-4">
          <Button color="alternative" pill class="!p-3 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 21) - 0.5)}>
            <Icon icon="mdi:minus" class="text-xl" />
          </Button>
          <div class="text-sm font-medium opacity-60 uppercase">Adjust Setpoint</div>
          <Button color="alternative" pill class="!p-3 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 21) + 0.5)}>
            <Icon icon="mdi:plus" class="text-xl" />
          </Button>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div class="flex items-center gap-2 opacity-60 text-xs uppercase font-bold">
              <Icon icon="mdi:calendar-clock" />
              Schedule Setpoint
            </div>
            <div class="text-xl font-bold mt-1">{!isNaN(setpoint) ? formatTemperature(setpoint) + '°' : '--'}</div>
          </div>
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div class="flex items-center gap-2 opacity-60 text-xs uppercase font-bold">
              <Icon icon="mdi:skip-next-circle-outline" />
              Next
            </div>
            <div class="text-xl font-bold mt-1">
              {!isNaN(nextSetpoint) ? formatTemperature(nextSetpoint) + '°' : '--'}
              <span class="text-xs font-medium opacity-60 ml-1">{formatNextTime(nextSetpointTimeStr)}</span>
            </div>
          </div>
        </div>
      {:else}
        <p class="text-center text-gray-500 py-12">Climate entity not found</p>
      {/if}
    </div>

    <!-- 2. DHW -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon icon="mdi:water-boiler" />
        Hot Water
        <span class="ml-auto text-sm font-medium px-3 py-1 rounded-full {dhwActive ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200' : 'bg-gray-100 dark:bg-gray-700 opacity-60'}">
          {dhwActive ? 'Heating' : 'Idle'}
        </span>
      </h2>

      <div class="flex flex-col items-center justify-center flex-1 gap-2">
        <Icon icon={dhwActive ? 'mdi:water-thermometer' : 'mdi:water-thermometer-outline'} class="text-5xl {dhwActive ? 'text-amber-500' : 'opacity-50'}" />
        <div class="text-5xl font-light">{!isNaN(dhwTemp) ? formatTemperature(dhwTemp) + '°' : '--'}</div>
        {#if dhwStatusText}
          <div class="text-sm uppercase opacity-60 font-bold">{dhwStatusText}</div>
        {/if}
      </div>
    </div>

    <!-- 3. Utilities & Extras -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 md:col-span-3">
      <h2 class="text-xl font-bold mb-4">Utilities & Extras</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center gap-3">
            <Icon icon="mdi:fireplace" class="text-2xl" />
            <span class="font-medium">Fireplace Mode</span>
          </div>
          <Toggle checked={fireplace?.state === 'on'} on:change={toggleFireplace} />
        </div>

        <div class="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center gap-3">
            <Icon icon="mdi:gauge" class="text-2xl {pressureWarn ? 'text-amber-500' : ''}" />
            <span class="font-medium">Water Pressure</span>
          </div>
          <span class="text-xl font-bold {pressureWarn ? 'text-amber-500' : ''}">
            {!isNaN(pressure) ? pressure.toFixed(1) : '--'} <span class="text-sm opacity-60">{pressureUnit}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
