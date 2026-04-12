<script lang="ts">
  import type { Weather } from '../providers/Provider';
  import WeatherSummaryTile from './WeatherSummaryTile.svelte';
  import { entities, callService } from '../HomeAssistant';
  import { configuration, loadConfiguration, storeConfiguration } from '../Configuration';
  import Icon from '@iconify/svelte';
  import SensorTile from './primitives/SensorTile.svelte';
  import SwitchTile from './primitives/SwitchTile.svelte';
  import { formatEnergy, formatPercentage, formatTemperature } from '../Formatting';

  export let weather: Weather | undefined;
  export let onWeatherClick: () => void;
  export let onSettingsClick: () => void;
  export let onTeslaClick: () => void;
  export let onSolarClick: () => void;
  export let onClimateClick: () => void;
  export let onCameraClick: () => void;

  const toggleEntity = async (entity_id: string) => {
    const domain = entity_id.split('.')[0];
    await callService(domain, 'toggle', { entity_id });
  };

  $: isBackupMode = (state => !state || 
                     state === '0' || 
                     state === 'unknown' || 
                     state === 'unavailable' || 
                     isNaN(parseFloat(state))
                    )($entities['sensor.inverter_load_power']?.state);
  
  $: consumptionValue = isBackupMode 
    ? parseFloat($entities['sensor.vue_123_1min']?.state) || 0
    : parseFloat($entities['sensor.inverter_load_power']?.state) || 0;

  $: gridValue = isBackupMode
    ? parseFloat($entities['sensor.vue_123_1min']?.state) || 0
    : parseFloat($entities['sensor.inverter_external_power']?.state) || 0;

  $: gridIcon = isBackupMode
    ? 'mdi:power-from-grid'
    : (gridValue > 0 ? 'mdi:power-from-grid' : 'mdi:power-to-grid');

  const chargingIconMap: Record<string, string> = {
    'Charging': 'mdi:lightning-bolt',
    'Disconnected': 'mdi:power-plug-off',
    'Stopped': 'mdi:stop-circle-outline',
    'Complete': 'mdi:check-circle-outline',
    'unknown': 'mdi:help-circle-outline'
  };

  $: powerFormatted = formatEnergy(parseFloat($entities['sensor.inverter_power']?.state) || 0);
  $: consumptionFormatted = formatEnergy(consumptionValue || 0);
  $: gridFormatted = formatEnergy(Math.abs(gridValue) || 0);
</script>

<!-- PORTRAIT layout: scrollable 6-column grid for tablets in portrait / smaller screens -->
<div class="landscape:hidden relative w-screen min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-800 safe-area-pad">
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 w-full text-gray-800 dark:text-gray-50">
    <!-- Weather Summary Tile (full width) -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        role="button"
        tabindex="0"
        class="col-span-2 sm:col-span-3 aspect-[2/1] shadow-lg hover:shadow-xl active:scale-[0.98] rounded-2xl group transition-all duration-200 cursor-pointer"
        onclick={onWeatherClick}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onWeatherClick()}
    >
      <div class="w-full h-full bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <WeatherSummaryTile {weather} />
      </div>
    </div>

    <!-- Tesla Tile -->
    <div class="aspect-square">
      <SensorTile
        mainIcon="simple-icons:tesla"
        mainIconClass="text-3xl text-gray-800 dark:text-gray-50"
        mainTooltip="Tesla Status: {$entities['sensor.juniper_nabija_sa']?.state || 'unknown'}"
        sensors={[
          {
            id: 'p-icon-tesla-battery',
            icon: 'fa-solid:car-battery',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Battery Level',
            value: formatPercentage(parseFloat($entities['sensor.juniper_uroven_baterie']?.state || '0')),
            unit: '%'
          },
          {
            id: 'p-icon-tesla-charging',
            icon: 'mdi:ev-station',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Charging Status',
            valueIcon: chargingIconMap[$entities['sensor.juniper_nabija_sa']?.state] || 'mdi:help-circle-outline',
            valueIconClass: 'text-gray-800 dark:text-gray-50'
          },
          {
            id: 'p-icon-tesla-temp',
            icon: 'mdi:thermometer',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Interior Temperature',
            value: formatTemperature(parseFloat($entities['sensor.juniper_vnutorna_teplota']?.state || '0')),
            unit: '°C'
          }
        ]}
        onclick={onTeslaClick}
      />
    </div>

    <!-- Solar Tile -->
    <div class="aspect-square">
      <SensorTile
        mainIcon="ix:electrical-energy-filled"
        mainIconClass="text-3xl text-gray-800 dark:text-gray-50"
        mainTooltip="Solar Energy"
        sensors={[
          {
            id: 'p-icon-solar-power',
            icon: 'mdi:sun-wireless',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Solar Production',
            value: powerFormatted.value,
            unit: powerFormatted.unit
          },
          {
            id: 'p-icon-consumption',
            icon: 'mdi:home-lightning-bolt',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Consumption',
            value: consumptionFormatted.value,
            unit: consumptionFormatted.unit
          },
          {
            id: 'p-icon-grid',
            icon: gridIcon,
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Grid Interaction',
            value: gridFormatted.value,
            unit: gridFormatted.unit
          }
        ]}
        onclick={onSolarClick}
      />
    </div>

    <!-- Climate Tile -->
    <div class="aspect-square">
      <SensorTile
        mainIcon="mdi:home-thermometer"
        mainIconClass="text-3xl text-gray-800 dark:text-gray-50"
        mainTooltip="Climate Control"
        sensors={[
          {
            id: 'p-icon-climate-setpoint',
            icon: 'mdi:calendar-clock',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Current Schedule Setpoint',
            value: formatTemperature(parseFloat($entities['sensor.circa_current_schedule_setpoint']?.state || '0')),
            unit: '°C'
          },
          {
            id: 'p-icon-dhw-temp',
            icon: 'mdi:water-boiler',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'DHW Water Temperature',
            value: formatTemperature(parseFloat($entities['sensor.dhw_water_temperature']?.state || '0')),
            unit: '°C'
          },
          {
            id: 'p-icon-fireplace',
            icon: 'mdi:fireplace',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Fireplace Mode',
            valueIcon: $entities['switch.circa_fireplace_mode']?.state === 'on' ? 'mdi:fireplace' : 'mdi:fireplace-off',
            valueIconClass: 'text-gray-800 dark:text-gray-50'
          }
        ]}
        onclick={onClimateClick}
      />
    </div>

    <!-- Switch tiles row -->
    <div class="aspect-square">
      <SwitchTile
        icon="mdi:garage-variant"
        label="Garage Light"
        isOn={$entities['switch.sonoff_1001e97b61']?.state === 'on'}
        onclick={() => toggleEntity('switch.sonoff_1001e97b61')}
      />
    </div>

    <div class="aspect-square">
      <SwitchTile
        icon="mdi:outdoor-lamp"
        label="Outdoor Light"
        isOn={$entities['switch.sonoff_outdoor_lights']?.state === 'on'}
        onclick={() => toggleEntity('switch.sonoff_outdoor_lights')}
      />
    </div>

    <!-- Control buttons (horizontal in portrait) -->
    <div class="aspect-square bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 p-2 flex flex-col gap-2 shadow-lg">
      <button onclick={onCameraClick} class="flex-1 flex items-center justify-center rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all min-h-[44px]">
          <Icon icon="mdi:camera" class="text-2xl" />
      </button>
      <button onclick={onSettingsClick} class="flex-1 flex items-center justify-center rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all min-h-[44px]">
          <Icon icon="radix-icons:gear" class="text-2xl" />
      </button>
      <button onclick={() => {
          const nextTheme = ($configuration.theme + 1) % 3;
          const currentConfig = loadConfiguration();
          storeConfiguration({...currentConfig, theme: nextTheme});
      }} class="flex-1 flex items-center justify-center rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all min-h-[44px]">
          <Icon icon={$configuration.theme === 0 ? 'radix-icons:sun' : $configuration.theme === 1 ? 'radix-icons:moon' : 'radix-icons:laptop'} class="text-2xl" />
      </button>
    </div>
  </div>
</div>

<!-- LANDSCAPE layout: full-screen 16x10 grid for wide screens -->
<div class="hidden landscape:block relative w-screen h-screen overflow-hidden bg-gray-50 dark:bg-gray-800">
  <div class="relative grid grid-cols-16 grid-rows-10 gap-2 p-2 w-full h-full text-gray-800 dark:text-gray-50">

    <!-- Row 1: Weather (6x5) + Tesla (5x5) + Solar (5x5) -->

    <!-- Weather Summary Tile -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        role="button"
        tabindex="0"
        class="col-start-1 row-start-1 col-span-6 row-span-5 shadow-lg hover:shadow-xl active:scale-[0.98] rounded-2xl group transition-all duration-200 cursor-pointer"
        onclick={onWeatherClick}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onWeatherClick()}
    >
      <div class="w-full h-full bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <WeatherSummaryTile {weather} />
      </div>
    </div>

    <!-- Tesla Tile (5x5) -->
    <div class="col-start-7 row-start-1 col-span-5 row-span-5">
      <SensorTile
        mainIcon="simple-icons:tesla"
        mainIconClass="text-6xl text-gray-800 dark:text-gray-50"
        mainTooltip="Tesla Status: {$entities['sensor.juniper_nabija_sa']?.state || 'unknown'}"
        sensors={[
          {
            id: 'icon-tesla-battery',
            icon: 'fa-solid:car-battery',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Battery Level',
            value: formatPercentage(parseFloat($entities['sensor.juniper_uroven_baterie']?.state || '0')),
            unit: '%'
          },
          {
            id: 'icon-tesla-charging',
            icon: 'mdi:ev-station',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Charging Status',
            valueIcon: chargingIconMap[$entities['sensor.juniper_nabija_sa']?.state] || 'mdi:help-circle-outline',
            valueIconClass: 'text-gray-800 dark:text-gray-50'
          },
          {
            id: 'icon-tesla-temp',
            icon: 'mdi:thermometer',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Interior Temperature',
            value: formatTemperature(parseFloat($entities['sensor.juniper_vnutorna_teplota']?.state || '0')),
            unit: '°C'
          }
        ]}
        onclick={onTeslaClick}
      />
    </div>

    <!-- Solar Tile (5x5) -->
    <div class="col-start-12 row-start-1 col-span-5 row-span-5">
      <SensorTile
        mainIcon="ix:electrical-energy-filled"
        mainIconClass="text-6xl text-gray-800 dark:text-gray-50"
        mainTooltip="Solar Energy"
        sensors={[
          {
            id: 'icon-solar-power',
            icon: 'mdi:sun-wireless',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Solar Production',
            value: powerFormatted.value,
            unit: powerFormatted.unit
          },
          {
            id: 'icon-consumption',
            icon: 'mdi:home-lightning-bolt',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Consumption',
            value: consumptionFormatted.value,
            unit: consumptionFormatted.unit
          },
          {
            id: 'icon-grid',
            icon: gridIcon,
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Grid Interaction',
            value: gridFormatted.value,
            unit: gridFormatted.unit
          }
        ]}
        onclick={onSolarClick}
      />
    </div>

    <!-- Row 2: Climate (4x5) + Garage (4x5) + Outdoor (4x5) + Controls (4x5) -->

    <!-- Climate Tile (4x5) -->
    <div class="col-start-1 row-start-6 col-span-4 row-span-5">
      <SensorTile
        mainIcon="mdi:home-thermometer"
        mainIconClass="text-6xl text-gray-800 dark:text-gray-50"
        mainTooltip="Climate Control"
        sensors={[
          {
            id: 'icon-climate-setpoint',
            icon: 'mdi:calendar-clock',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Current Schedule Setpoint',
            value: formatTemperature(parseFloat($entities['sensor.circa_current_schedule_setpoint']?.state || '0')),
            unit: '°C'
          },
          {
            id: 'icon-dhw-temp',
            icon: 'mdi:water-boiler',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'DHW Water Temperature',
            value: formatTemperature(parseFloat($entities['sensor.dhw_water_temperature']?.state || '0')),
            unit: '°C'
          },
          {
            id: 'icon-fireplace',
            icon: 'mdi:fireplace',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Fireplace Mode',
            valueIcon: $entities['switch.circa_fireplace_mode']?.state === 'on' ? 'mdi:fireplace' : 'mdi:fireplace-off',
            valueIconClass: 'text-gray-800 dark:text-gray-50'
          }
        ]}
        onclick={onClimateClick}
      />
    </div>

    <!-- Garage Light Tile (4x5) -->
    <div class="col-start-5 row-start-6 col-span-4 row-span-5">
      <SwitchTile
        icon="mdi:garage-variant"
        label="Garage Light"
        isOn={$entities['switch.sonoff_1001e97b61']?.state === 'on'}
        onclick={() => toggleEntity('switch.sonoff_1001e97b61')}
      />
    </div>

    <!-- Outdoor Light Tile (4x5) -->
    <div class="col-start-9 row-start-6 col-span-4 row-span-5">
      <SwitchTile
        icon="mdi:outdoor-lamp"
        label="Outdoor Light"
        isOn={$entities['switch.sonoff_outdoor_lights']?.state === 'on'}
        onclick={() => toggleEntity('switch.sonoff_outdoor_lights')}
      />
    </div>

    <!-- Control Tile (4x5) -->
    <div class="col-start-13 row-start-6 col-span-4 row-span-5 bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 p-3 grid grid-cols-2 grid-rows-2 gap-2 shadow-lg">
      <button onclick={onCameraClick} class="flex items-center justify-center rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
          <Icon icon="mdi:camera" class="text-[40px]" />
      </button>
      <button onclick={onSettingsClick} class="flex items-center justify-center rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
          <Icon icon="radix-icons:gear" class="text-[40px]" />
      </button>
      <button onclick={() => {
          const nextTheme = ($configuration.theme + 1) % 3;
          const currentConfig = loadConfiguration();
          storeConfiguration({...currentConfig, theme: nextTheme});
      }} class="flex items-center justify-center rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
          <Icon icon={$configuration.theme === 0 ? 'radix-icons:sun' : $configuration.theme === 1 ? 'radix-icons:moon' : 'radix-icons:laptop'} class="text-[40px]" />
      </button>
      <div class="flex items-center justify-center rounded-xl opacity-30">
          <Icon icon="mdi:dots-horizontal" class="text-[40px]" />
      </div>
    </div>

  </div>
</div>
