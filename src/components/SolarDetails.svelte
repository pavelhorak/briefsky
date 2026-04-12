<script lang="ts">
  import { entities } from '../HomeAssistant';
  import Icon from '@iconify/svelte';
  import { Button } from 'flowbite-svelte';
  import SensorHistoryChart from './SensorHistoryChart.svelte';
  import { formatEnergy } from '../Formatting';

  $: isBackupMode = (state => !state || 
                     state === '0' || 
                     state === 'unknown' || 
                     state === 'unavailable' || 
                     isNaN(parseFloat(state))
                    )($entities['sensor.inverter_load_power']?.state);

  $: entities_config = [
    { id: 'sensor.inverter_power', label: 'Solar', color: 'stroke-yellow-400', fill: 'fill-yellow-400', type: 'line' as const, abs: true },
    { 
      id: isBackupMode ? 'sensor.vue_123_1min' : 'sensor.inverter_load_power', 
      label: 'Consumption', 
      color: 'stroke-blue-500', 
      fill: 'fill-blue-500', 
      type: 'line' as const, 
      abs: true 
    },
    { 
      id: isBackupMode ? 'sensor.vue_123_1min' : 'sensor.inverter_external_power', 
      label: 'Grid', 
      color: 'stroke-purple-500', 
      fill: 'fill-purple-500', 
      type: 'bar' as const, 
      abs: true 
    }
  ];

  let chartKey = 0;

  function refresh() {
    chartKey++;
  }

  $: if (isBackupMode !== undefined) {
    chartKey++;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click|stopPropagation class="cursor-default max-w-6xl mx-auto p-4 md:p-8 text-gray-800 dark:text-gray-50">
  <div class="flex items-center justify-between mb-6 md:mb-8">
    <div class="flex items-center gap-3 md:gap-4">
        <Icon icon="ix:electrical-energy-filled" class="text-4xl md:text-6xl text-gray-800 dark:text-gray-50" />
        <h1 class="text-2xl md:text-4xl font-bold">Solar Energy</h1>
    </div>
    <Button color="alternative" on:click={refresh} class="border-gray-800 dark:border-gray-50 text-gray-800 dark:text-gray-50">Refresh</Button>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12 text-center">
            {#each entities_config as config}
            {@const formatted = formatEnergy(Math.abs(parseFloat($entities[config.id]?.state)) || 0)}
            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <div class="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">{config.label}</div>
                <div class="text-3xl font-black text-gray-800 dark:text-gray-50">
                {formatted.value} {formatted.unit}
                </div>
            </div>
            {/each}
        </div>

        {#key chartKey}
            <div class="mt-8">
                <SensorHistoryChart 
                    title="24h Production vs Consumption" 
                    entities={entities_config} 
                    height={300} 
                    valueFormatter={(v) => formatEnergy(v).value}
                    unit=""
                />
            </div>
        {/key}
  </div>
</div>
