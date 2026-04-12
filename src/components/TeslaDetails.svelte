<script lang="ts">
  import { entities, callService } from '../HomeAssistant';
  import Icon from '@iconify/svelte';
  import { Button, Badge } from 'flowbite-svelte';
  import { formatTemperature } from '../Formatting';

  const climate_id = 'climate.juniper_klimatizacia';
  $: climate = $entities[climate_id];

  async function toggleClimate() {
    if (!climate) return;
    const service = climate.state === 'off' ? 'turn_on' : 'turn_off';
    await callService('climate', service, { entity_id: climate_id });
  }

  async function setTemperature(temp: number) {
    await callService('climate', 'set_temperature', {
      entity_id: climate_id,
      temperature: temp
    });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click|stopPropagation class="cursor-default max-w-4xl mx-auto p-4 md:p-8 text-gray-800 dark:text-gray-50">
  <div class="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
    <Icon icon="simple-icons:tesla" class="text-4xl md:text-6xl text-gray-800 dark:text-gray-50" />
    <div>
      <h1 class="text-2xl md:text-4xl font-bold">Tesla Status</h1>
      <p class="text-gray-500">Juniper</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
    <!-- Climate Control Card -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-start mb-6">
        <h2 class="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-50">
          <Icon icon="mdi:air-conditioner" class="text-gray-800 dark:text-gray-50" />
          Climate
        </h2>
        <Badge color="dark">
          {climate?.state?.toUpperCase() || 'UNKNOWN'}
        </Badge>
      </div>

      {#if climate}
        <div class="flex flex-col items-center gap-6">
          <div class="text-6xl font-light text-gray-800 dark:text-gray-50">
            {formatTemperature(climate.attributes.current_temperature)}°
            <span class="text-sm font-semibold opacity-50 block text-center uppercase">Current</span>
          </div>

          <div class="flex items-center gap-8">
            <Button color="alternative" pill class="!p-4 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 20) - 0.5)}>
              <Icon icon="mdi:minus" class="text-2xl" />
            </Button>
            <div class="text-4xl font-bold w-20 text-center text-gray-800 dark:text-gray-50">
              {formatTemperature(climate.attributes.temperature)}°
            </div>
            <Button color="alternative" pill class="!p-4 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 20) + 0.5)}>
              <Icon icon="mdi:plus" class="text-2xl" />
            </Button>
          </div>

          <Button color="alternative" class="w-full py-4 rounded-2xl text-lg font-bold border-gray-800 dark:border-gray-50 text-gray-800 dark:text-gray-50" on:click={toggleClimate}>
            {climate.state === 'off' ? 'START CLIMATE' : 'STOP CLIMATE'}
          </Button>
        </div>
      {:else}
        <p class="text-center text-gray-500 py-12">Climate entity not found</p>
      {/if}
    </div>

    <!-- Stats Card -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-50">Quick Stats</h2>
        
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div class="flex items-center gap-3">
                <Icon icon="mdi:battery" class="text-2xl text-gray-800 dark:text-gray-50" />
                <span class="font-medium text-gray-800 dark:text-gray-50">Battery Level</span>
            </div>
            <span class="text-xl font-bold text-gray-800 dark:text-gray-50">{$entities['sensor.juniper_uroven_baterie']?.state || '--'}%</span>
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div class="flex items-center gap-3">
                <Icon icon="mdi:lightning-bolt" class="text-2xl text-gray-800 dark:text-gray-50" />
                <span class="font-medium text-gray-800 dark:text-gray-50">Charging</span>
            </div>
            <span class="text-xl font-bold text-gray-800 dark:text-gray-50">{$entities['sensor.juniper_nabija_sa']?.state || 'Off'}</span>
        </div>
    </div>
  </div>
</div>
