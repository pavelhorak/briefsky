<script lang="ts">
  import Icon from '@iconify/svelte';
  import SensorHistoryChart from './SensorHistoryChart.svelte';
  import { formatEnergy } from '../Formatting';
  import { configuration } from '../Configuration';
  import { consumptionEntityId, gridEntityId } from '../EnergyState';
  import { getContext } from 'svelte';

  const closeOverlay = getContext<() => void>('overlay-close');

  $: ids = $configuration.entityIds;

  $: entities_config = [
    { id: ids.solarPower, label: 'Solar', color: 'stroke-yellow-400', fill: 'fill-yellow-400', swatch: 'bg-yellow-400', type: 'line' as const, abs: true },
    {
      id: $consumptionEntityId,
      label: 'Consumption',
      color: 'stroke-blue-500',
      fill: 'fill-blue-500',
      swatch: 'bg-blue-500',
      type: 'line' as const,
      abs: true
    },
    {
      id: $gridEntityId,
      label: 'Grid',
      color: 'stroke-purple-500',
      fill: 'fill-purple-500',
      swatch: 'bg-purple-500',
      type: 'bar' as const,
      abs: true
    }
  ];

  let chartKey = 0;

  $: if ($consumptionEntityId || $gridEntityId) {
    chartKey++;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={(e: Event) => e.stopPropagation()} class="cursor-default max-w-6xl mx-auto px-4 md:px-8 pt-2 pb-4 md:pb-8 text-gray-800 dark:text-gray-50">
  <div class="flex items-center mb-6 md:mb-8">
    <div class="flex items-center gap-3 md:gap-4">
        <button onclick={closeOverlay} class="rounded-full p-2 -m-2 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all" aria-label="Close">
          <Icon icon="ix:electrical-energy-filled" class="text-4xl md:text-6xl text-gray-800 dark:text-gray-50" />
        </button>
        <h1 class="text-2xl md:text-4xl font-bold">Solar Energy</h1>
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 text-sm md:text-base">
            {#each entities_config as config}
                <div class="flex items-center gap-2">
                    <span class="inline-block w-4 h-4 rounded-full {config.swatch}"></span>
                    <span class="text-gray-700 dark:text-gray-200">{config.label}</span>
                </div>
            {/each}
        </div>
        {#key chartKey}
            <SensorHistoryChart
                title="24h Production vs Consumption"
                entities={entities_config}
                height={300}
                valueFormatter={(v) => formatEnergy(v).value}
                unit=""
            />
        {/key}
  </div>
</div>
