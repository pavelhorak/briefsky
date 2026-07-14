<script lang="ts">
  import type { Weather } from '../providers/Provider';
  import WeatherSummaryTile from './WeatherSummaryTile.svelte';
  import { entities, callService } from '../HomeAssistant';
  import { configuration, loadConfiguration, storeConfiguration } from '../Configuration';
  import Icon from '@iconify/svelte';
  import SensorTile from './primitives/SensorTile.svelte';
  import SwitchTile from './primitives/SwitchTile.svelte';
  import EnergyFlowTile from './EnergyFlowTile.svelte';
  import EnergyFlowDiagram from './EnergyFlowDiagram.svelte';
  import { formatPercentage, formatTemperature } from '../Formatting';
  import { virtualBattery } from '../VirtualBattery';
  import { onMount, onDestroy } from 'svelte';

  export let weather: Weather | undefined;

  /* Clock - updates every second */
  let now = new Date();
  let clockInterval: number;
  onMount(() => { clockInterval = setInterval(() => { now = new Date(); }, 1000); });
  onDestroy(() => { clearInterval(clockInterval); });
  $: dayOfMonth = now.getDate();
  $: weekDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  $: monthName = now.toLocaleDateString('en-US', { month: 'long' });
  $: timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  export let onWeatherClick: () => void;
  export let onSettingsClick: () => void;
  export let onTeslaClick: () => void;
  export let onSolarClick: () => void;
  export let onClimateClick: () => void;
  export let onCameraClick: () => void;
  export let onCallDadClick: () => void;
  export let onCallMomClick: () => void;

  $: ids = $configuration.entityIds;

  const toggleEntity = async (entity_id: string) => {
    const domain = entity_id.split('.')[0];
    await callService(domain, 'toggle', { entity_id });
  };

  $: cablePlugged = $entities[ids.teslaChargingCable]?.state === 'on';
  $: isCharging = $entities[ids.teslaCharging]?.state?.toLowerCase() === 'charging';
  $: chargeIcon = !cablePlugged
    ? 'mdi:power-plug-off'
    : isCharging
      ? 'mdi:battery-charging'
      : 'mdi:power-plug';
  $: chargeTooltip = !cablePlugged
    ? 'Cable Unplugged'
    : isCharging
      ? 'Charging'
      : 'Plugged In — Not Charging';

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
        mainTooltip="Tesla Status: {$entities[ids.teslaCharging]?.state || 'unknown'}"
        sensors={[
          {
            id: 'p-icon-tesla-battery',
            icon: 'fa-solid:car-battery',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Battery Level',
            value: formatPercentage(parseFloat($entities[ids.teslaBattery]?.state || '0')),
            unit: '%'
          },
          {
            id: 'p-icon-tesla-charging',
            icon: 'mdi:ev-station',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: chargeTooltip,
            valueIcon: chargeIcon,
            valueIconClass: 'text-gray-800 dark:text-gray-50'
          },
          {
            id: 'p-icon-tesla-temp',
            icon: 'mdi:thermometer',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Interior Temperature',
            value: formatTemperature(parseFloat($entities[ids.teslaInteriorTemp]?.state || '0')),
            unit: '°C'
          }
        ]}
        onclick={onTeslaClick}
      />
    </div>

    <!-- Energy Flow Tile -->
    <div class="aspect-square">
      <EnergyFlowTile onclick={onSolarClick} />
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
            value: formatTemperature(parseFloat($entities[ids.scheduleSetpoint]?.state || '0')),
            unit: '°C'
          },
          {
            id: 'p-icon-dhw-temp',
            icon: 'mdi:water-boiler',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'DHW Water Temperature',
            value: formatTemperature(parseFloat($entities[ids.dhwTemp]?.state || '0')),
            unit: '°C'
          },
          {
            id: 'p-icon-fireplace',
            icon: 'mdi:fireplace',
            iconClass: 'text-gray-800 dark:text-gray-50',
            tooltip: 'Fireplace Mode',
            valueIcon: $entities[ids.fireplaceSwitch]?.state === 'on' ? 'mdi:fireplace' : 'mdi:fireplace-off',
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
        isOn={$entities[ids.garageLight]?.state === 'on'}
        onclick={() => toggleEntity(ids.garageLight)}
      />
    </div>

    <div class="aspect-square">
      <SwitchTile
        icon="mdi:outdoor-lamp"
        label="Outdoor Light"
        isOn={$entities[ids.outdoorLight]?.state === 'on'}
        onclick={() => toggleEntity(ids.outdoorLight)}
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

<!-- LANDSCAPE layout: Tesla-inspired full-screen layout -->
<div class="hidden landscape:block relative w-screen h-screen overflow-hidden bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-50">
  <div class="relative grid grid-cols-16 grid-rows-10 gap-3 p-3 w-full h-full">

    <!-- Row 1: Header strip — date/time left (chrome icons are absolute top-right of viewport) -->
    <div class="col-span-16 row-start-1 row-span-1 flex items-center px-4 whitespace-nowrap">
      <div class="flex items-baseline gap-6">
        <span class="text-4xl font-medium tracking-tight">{timeStr}</span>
        <span class="text-2xl font-light opacity-70">{weekDay}, {dayOfMonth} {monthName}</span>
      </div>
    </div>

    <!-- Chrome icons: flush to top-right corner of the viewport -->
    <div class="fixed top-2 right-2 z-10 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-2 py-1 shadow-sm">
      <!-- Mom / Dad call buttons — color-coded round avatars so a 6-year-old can recognize them at a glance -->
      <button onclick={onCallMomClick} aria-label="Call {$configuration.momName}"
        class="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white active:scale-95 transition shadow-sm">
        <span class="text-xl font-medium">{($configuration.momName || 'M').charAt(0).toUpperCase()}</span>
      </button>
      <button onclick={onCallDadClick} aria-label="Call {$configuration.dadName}"
        class="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white active:scale-95 transition shadow-sm">
        <span class="text-xl font-medium">{($configuration.dadName || 'D').charAt(0).toUpperCase()}</span>
      </button>
      <div class="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>
      <button onclick={onCameraClick} aria-label="Camera"
        class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
        <Icon icon="mdi:cctv" class="text-3xl" />
      </button>
      <button onclick={onSettingsClick} aria-label="Settings"
        class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
        <Icon icon="radix-icons:gear" class="text-3xl" />
      </button>
      <button aria-label="Theme" onclick={() => {
          const nextTheme = ($configuration.theme + 1) % 3;
          const currentConfig = loadConfiguration();
          storeConfiguration({...currentConfig, theme: nextTheme});
        }}
        class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
        <Icon icon={$configuration.theme === 0 ? 'radix-icons:sun' : $configuration.theme === 1 ? 'radix-icons:moon' : 'radix-icons:laptop'} class="text-3xl" />
      </button>
    </div>

    <!-- Rows 2-6: Weather hero (10 cols) + Energy stats (6 cols) -->

    <!-- Weather hero -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div role="button" tabindex="0"
      class="col-start-1 col-span-8 row-start-2 row-span-5 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.99] transition"
      onclick={onWeatherClick}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onWeatherClick()}>
      <WeatherSummaryTile {weather} />
    </div>

    <!-- Energy flow diagram — direction shown by animated dots, no need for separate arrows -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div role="button" tabindex="0"
      class="col-start-9 col-span-8 row-start-2 row-span-5 bg-white dark:bg-gray-900 rounded-3xl p-6 cursor-pointer active:scale-[0.99] transition flex flex-col"
      onclick={onSolarClick}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onSolarClick()}>
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-semibold opacity-50 tracking-[0.2em]">ENERGY</div>
        <div class="flex items-center gap-4">
          {#if $virtualBattery.balance !== null}
            <div class="flex items-center gap-2 whitespace-nowrap" title="Virtual battery balance">
              <Icon icon="mdi:battery-plus-variant" class="text-2xl opacity-60" />
              <span class="text-xl font-medium">{Math.round($virtualBattery.balance)}<span class="text-sm opacity-50 ml-1">kWh</span></span>
            </div>
          {/if}
          <Icon icon="mdi:lightning-bolt-outline" class="text-3xl opacity-60" />
        </div>
      </div>
      <div class="flex-1 flex items-center justify-center min-h-0">
        <EnergyFlowDiagram wide />
      </div>
    </div>

    <!-- Rows 7-9: Climate (8 cols) + Tesla (8 cols) -->

    <!-- Climate stats -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div role="button" tabindex="0"
      class="col-start-1 col-span-8 row-start-7 row-span-3 bg-white dark:bg-gray-900 rounded-3xl p-6 cursor-pointer active:scale-[0.99] transition flex flex-col"
      onclick={onClimateClick}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClimateClick()}>
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-semibold opacity-50 tracking-[0.2em]">CLIMATE</div>
        <Icon icon="mdi:home-thermometer-outline" class="text-3xl opacity-60" />
      </div>
      <div class="flex-1 grid grid-cols-3 gap-6 content-center">
        <div>
          <div class="text-xs opacity-50 uppercase tracking-widest mb-1">Heating</div>
          <div class="text-5xl font-normal leading-none">{formatTemperature(parseFloat($entities[ids.scheduleSetpoint]?.state || '0'))}<span class="text-2xl opacity-50 ml-1">°C</span></div>
        </div>
        <div>
          <div class="text-xs opacity-50 uppercase tracking-widest mb-1">DHW</div>
          <div class="text-5xl font-normal leading-none">{formatTemperature(parseFloat($entities[ids.dhwTemp]?.state || '0'))}<span class="text-2xl opacity-50 ml-1">°C</span></div>
        </div>
        <div>
          <div class="text-xs opacity-50 uppercase tracking-widest mb-1">Pressure</div>
          <div class="text-5xl font-normal leading-none">{$entities[ids.waterPressure]?.state || '--'}<span class="text-2xl opacity-50 ml-1">{$entities[ids.waterPressure]?.attributes?.unit_of_measurement || 'bar'}</span></div>
        </div>
      </div>
    </div>

    <!-- Tesla stats -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div role="button" tabindex="0"
      class="col-start-9 col-span-8 row-start-7 row-span-3 bg-white dark:bg-gray-900 rounded-3xl p-6 cursor-pointer active:scale-[0.99] transition flex flex-col"
      onclick={onTeslaClick}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onTeslaClick()}>
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-semibold opacity-50 tracking-[0.2em]">TESLA</div>
        <Icon icon="simple-icons:tesla" class="text-3xl opacity-60" />
      </div>
      <div class="flex-1 grid grid-cols-3 gap-6 content-center">
        <div>
          <div class="text-xs opacity-50 uppercase tracking-widest mb-1">Charge</div>
          <div class="text-5xl font-normal leading-none">{formatPercentage(parseFloat($entities[ids.teslaBattery]?.state || '0'))}<span class="text-2xl opacity-50 ml-1">%</span></div>
        </div>
        <div>
          <div class="text-xs opacity-50 uppercase tracking-widest mb-1">Cabin</div>
          <div class="text-5xl font-normal leading-none">{formatTemperature(parseFloat($entities[ids.teslaInteriorTemp]?.state || '0'))}<span class="text-2xl opacity-50 ml-1">°C</span></div>
        </div>
        <div>
          <div class="text-xs opacity-50 uppercase tracking-widest mb-1">Status</div>
          <div class="text-5xl font-normal leading-none flex items-center gap-3">
            <Icon icon={chargeIcon} class="opacity-90" />
            <span class="text-2xl opacity-70">{!cablePlugged ? 'Unplugged' : isCharging ? 'Charging' : 'Plugged'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 10: Switches pill strip -->
    <div class="col-span-16 row-start-10 row-span-1 px-6 flex items-center justify-around">
      {#each [
        { entity: ids.fireplaceSwitch, label: 'Fireplace', onIcon: 'mdi:fireplace', offIcon: 'mdi:fireplace', action: () => toggleEntity(ids.fireplaceSwitch) },
        { entity: ids.garageLight, label: 'Garage', onIcon: 'mdi:lightbulb', offIcon: 'mdi:lightbulb-off', action: () => toggleEntity(ids.garageLight) },
        { entity: ids.outdoorLight, label: 'Outdoor', onIcon: 'mdi:outdoor-lamp', offIcon: 'mdi:outdoor-lamp', action: () => toggleEntity(ids.outdoorLight) },
        { entity: ids.garageDoor, label: 'Door', onIcon: 'mdi:garage-open-variant', offIcon: 'mdi:garage-variant', action: () => toggleEntity(ids.garageDoor) },
        { entity: ids.gateOpen, label: 'Gate', onIcon: 'mdi:gate-open', offIcon: 'mdi:gate', action: () => {
            const isOpen = $entities[ids.gateOpen]?.state === 'on';
            toggleEntity(isOpen ? ids.gateClose : ids.gateOpen);
          } }
      ] as sw (sw.label)}
        {@const on = $entities[sw.entity]?.state === 'on'}
        <button onclick={(e) => { sw.action(); e.currentTarget.blur(); }}
          class="flex items-center gap-3 px-5 py-2 rounded-2xl bg-transparent hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition whitespace-nowrap appearance-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:shadow-none">
          <Icon icon={on ? sw.onIcon : sw.offIcon} class="text-4xl {on ? 'opacity-100' : 'opacity-40'}" />
          <span class="text-lg font-medium {on ? 'opacity-100' : 'opacity-50'}">{sw.label}</span>
        </button>
      {/each}
    </div>

  </div>
</div>
