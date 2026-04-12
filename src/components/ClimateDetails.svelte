<script lang="ts">
  import { entities, callService } from '../HomeAssistant';
  import Icon from '@iconify/svelte';
  import { Button, Toggle } from 'flowbite-svelte';
  import { formatTemperature } from '../Formatting';

  const climate_id = 'climate.circa';
  const fireplace_id = 'switch.circa_fireplace_mode';

  $: climate = $entities[climate_id];
  $: fireplace = $entities[fireplace_id];

  async function setTemperature(temp: number) {
    await callService('climate', 'set_temperature', {
      entity_id: climate_id,
      temperature: temp
    });
  }

  async function toggleFireplace() {
    await callService('switch', 'toggle', {
      entity_id: fireplace_id
    });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click|stopPropagation class="cursor-default max-w-4xl mx-auto p-4 md:p-8 text-gray-800 dark:text-gray-50">
  <div class="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
    <Icon icon="mdi:home-thermometer" class="text-4xl md:text-6xl text-gray-800 dark:text-gray-50" />
    <div>
      <h1 class="text-2xl md:text-4xl font-bold">Climate Control</h1>
      <p class="text-gray-500">Circa System</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
    <!-- Climate Card -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
        <Icon icon="mdi:thermostat" class="text-gray-800 dark:text-gray-50" />
        Heating
      </h2>

      {#if climate}
        <div class="flex flex-col items-center gap-6">
          <div class="text-6xl font-light text-gray-800 dark:text-gray-50">
            {formatTemperature(climate.attributes.current_temperature)}°
            <span class="text-sm font-semibold opacity-50 block text-center uppercase">Current</span>
          </div>

          <div class="flex items-center gap-8">
            <Button color="alternative" pill class="!p-4 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 21) - 0.5)}>
              <Icon icon="mdi:minus" class="text-2xl" />
            </Button>
            <div class="text-4xl font-bold w-20 text-center text-gray-800 dark:text-gray-50">
              {formatTemperature(climate.attributes.temperature)}°
            </div>
            <Button color="alternative" pill class="!p-4 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 21) + 0.5)}>
              <Icon icon="mdi:plus" class="text-2xl" />
            </Button>
          </div>
          
          <div class="text-sm font-medium opacity-50 text-gray-800 dark:text-gray-50">TARGET SETPOINT</div>
        </div>
      {:else}
        <p class="text-center text-gray-500 py-12">Climate entity not found</p>
      {/if}
    </div>

    <!-- Controls Card -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-8">
        <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-50">Additional Controls</h2>
        
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div class="flex items-center gap-3">
                <Icon icon="mdi:fireplace" class="text-2xl text-gray-800 dark:text-gray-50" />
                <span class="font-medium text-gray-800 dark:text-gray-50">Fireplace Mode</span>
            </div>
            <Toggle 
                checked={fireplace?.state === 'on'} 
                on:change={toggleFireplace}
                color="primary"
            />
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div class="flex items-center gap-3">
                <Icon icon="mdi:water-boiler" class="text-2xl text-gray-800 dark:text-gray-50" />
                <span class="font-medium text-gray-800 dark:text-gray-50">DHW Temperature</span>
            </div>
            <span class="text-xl font-bold text-gray-800 dark:text-gray-50">{formatTemperature($entities['sensor.dhw_water_temperature']?.state)}°C</span>
        </div>
    </div>
  </div>
</div>
