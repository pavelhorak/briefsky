<script lang="ts">
  import { entities, callService } from '../HomeAssistant';
  import { configuration } from '../Configuration';
  import Icon from '@iconify/svelte';
  import { Button, Toggle } from 'flowbite-svelte';
  import { formatTemperature } from '../Formatting';
  import { getContext } from 'svelte';

  const closeOverlay = getContext<() => void>('overlay-close');

  $: ids = $configuration.entityIds;
  $: climate = $entities[ids.teslaClimate];

  function num(id: string, fallback = 0): number {
    const v = parseFloat($entities[id]?.state ?? '');
    return Number.isFinite(v) ? v : fallback;
  }
  function str(id: string): string {
    return $entities[id]?.state ?? '';
  }

  $: cablePlugged = str(ids.teslaChargingCable) === 'on';
  $: chargeState = str(ids.teslaCharging).toLowerCase();
  $: isCharging = chargeState === 'charging';

  $: battery = num(ids.teslaBattery);
  $: range = num(ids.teslaRange);
  $: chargeLimit = num(ids.teslaChargeLimit, 80);

  $: chargeCurrent = num(ids.teslaChargeCurrent);
  $: chargeVoltage = num(ids.teslaChargeVoltage);
  $: chargePower = num(ids.teslaChargePower);
  $: addedEnergy = num(ids.teslaAddedEnergy);
  $: timeToFullStr = str(ids.teslaTimeToFull);

  $: insideTemp = num(ids.teslaInteriorTemp);
  $: outsideTemp = num(ids.teslaOutsideTemp);

  $: locked = str(ids.teslaLock) === 'locked';
  $: portLocked = str(ids.teslaChargePortLock) === 'locked';
  $: sentry = str(ids.teslaSentryMode) === 'on';
  $: defrost = str(ids.teslaDefrost) === 'on';
  $: chargePortOpen = str(ids.teslaChargePort) !== 'closed';
  $: trunk = str(ids.teslaTrunk);
  $: frunk = str(ids.teslaFrunk);
  $: windows = str(ids.teslaWindows);

  const doorIds = [
    'binary_sensor.juniper_predne_dvere_vodica',
    'binary_sensor.juniper_predne_dvere_spolujazdca',
    'binary_sensor.juniper_zadne_dvere_vodica',
    'binary_sensor.juniper_zadne_dvere_spolujazdca',
  ];
  const windowIds = [
    'binary_sensor.juniper_predne_okno_vodica',
    'binary_sensor.juniper_predne_okno_spolujazdca',
    'binary_sensor.juniper_zadne_okno_vodica',
    'binary_sensor.juniper_zadne_okno_spolujazdca',
  ];

  $: anyDoorOpen = doorIds.some(id => $entities[id]?.state === 'on');
  $: anyWindowOpen = windowIds.some(id => $entities[id]?.state === 'on') || windows === 'open';

  function chargeStateLabel(state: string): string {
    if (!cablePlugged) return 'Unplugged';
    if (state === 'charging') return 'Charging';
    if (state === 'complete') return 'Complete';
    if (state === 'stopped') return 'Stopped';
    if (state === 'disconnected') return 'Disconnected';
    return state || 'Connected';
  }

  function formatTimeToFull(iso: string): string {
    if (!iso || iso === 'unknown' || iso === 'unavailable') return '--';
    const target = new Date(iso).getTime();
    const now = Date.now();
    const mins = Math.max(0, Math.round((target - now) / 60000));
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  async function setTemperature(temp: number) {
    await callService('climate', 'set_temperature', {
      entity_id: ids.teslaClimate,
      temperature: temp
    });
  }
  async function toggleClimate() {
    if (!climate) return;
    const service = climate.state === 'off' ? 'turn_on' : 'turn_off';
    await callService('climate', service, { entity_id: ids.teslaClimate });
  }
  async function toggleSwitch(entity_id: string) {
    await callService('switch', 'toggle', { entity_id });
  }
  async function toggleLock(entity_id: string, locked: boolean) {
    await callService('lock', locked ? 'unlock' : 'lock', { entity_id });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={(e) => e.stopPropagation()} class="cursor-default max-w-6xl mx-auto px-4 md:px-8 pt-2 pb-4 md:pb-8 text-gray-800 dark:text-gray-50">

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

    <!-- 1. Battery & Range (with page title integrated) -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-3">
        <button onclick={closeOverlay} class="rounded-full p-1 -m-1 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all" aria-label="Close">
          <Icon icon="simple-icons:tesla" class="text-3xl text-gray-800 dark:text-gray-50" />
        </button>
        <span>Battery</span>
        <span class="text-sm font-medium opacity-60 ml-auto">Juniper</span>
      </h2>
      <div class="flex items-baseline gap-3 mb-2">
        <div class="text-6xl font-light">{battery.toFixed(0)}<span class="text-2xl opacity-60">%</span></div>
        <div class="text-2xl opacity-70">{range.toFixed(0)} <span class="text-base">km</span></div>
      </div>
      <!-- Battery bar with charge limit marker -->
      <div class="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div class="absolute left-0 top-0 h-full bg-gray-800 dark:bg-gray-50 transition-all" style="width: {battery}%"></div>
        <div class="absolute top-0 h-full w-0.5 bg-yellow-500" style="left: {chargeLimit}%"></div>
      </div>
      <div class="flex justify-between text-xs opacity-60">
        <span>0%</span>
        <span>Limit: {chargeLimit}%</span>
        <span>100%</span>
      </div>
    </div>

    <!-- 2. Charging -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon icon={!cablePlugged ? 'mdi:power-plug-off' : isCharging ? 'mdi:battery-charging' : 'mdi:power-plug'} />
        Charging
        <span class="ml-auto text-sm font-medium opacity-60">{chargeStateLabel(chargeState)}</span>
      </h2>
      {#if isCharging}
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div class="opacity-60 text-xs uppercase font-bold">Power</div>
            <div class="text-2xl font-bold">{chargePower.toFixed(1)} <span class="text-sm opacity-60">kW</span></div>
          </div>
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div class="opacity-60 text-xs uppercase font-bold">Current / Voltage</div>
            <div class="text-2xl font-bold">{chargeCurrent.toFixed(0)}<span class="text-sm opacity-60">A</span> · {chargeVoltage.toFixed(0)}<span class="text-sm opacity-60">V</span></div>
          </div>
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div class="opacity-60 text-xs uppercase font-bold">Time to Full</div>
            <div class="text-2xl font-bold">{formatTimeToFull(timeToFullStr)}</div>
          </div>
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div class="opacity-60 text-xs uppercase font-bold">Added</div>
            <div class="text-2xl font-bold">{addedEnergy.toFixed(1)} <span class="text-sm opacity-60">kWh</span></div>
          </div>
        </div>
      {:else}
        <div class="py-6 text-center opacity-60">
          {#if cablePlugged}
            <Icon icon="mdi:power-plug" class="text-5xl mx-auto mb-2" />
            <div>Cable connected, not charging</div>
            {#if addedEnergy > 0}
              <div class="text-sm mt-1">Last session: {addedEnergy.toFixed(1)} kWh</div>
            {/if}
          {:else}
            <Icon icon="mdi:power-plug-off" class="text-5xl mx-auto mb-2" />
            <div>Cable unplugged</div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- 3. Climate -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon icon="mdi:air-conditioner" />
        Climate
        <span class="ml-auto text-sm font-medium opacity-60">{climate?.state?.toUpperCase() || 'UNKNOWN'}</span>
      </h2>

      <div class="flex items-center justify-around mb-4 gap-2">
        <div class="text-center">
          <div class="text-xs uppercase opacity-60 font-bold">Inside</div>
          <div class="text-3xl font-light">{formatTemperature(insideTemp)}°</div>
        </div>
        <Icon icon="mdi:swap-horizontal" class="text-2xl opacity-40" />
        <div class="text-center">
          <div class="text-xs uppercase opacity-60 font-bold">Outside</div>
          <div class="text-3xl font-light">{formatTemperature(outsideTemp)}°</div>
        </div>
      </div>

      {#if climate}
        <div class="flex items-center justify-center gap-4 mb-4">
          <Button color="alternative" pill class="!p-3 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 20) - 0.5)}>
            <Icon icon="mdi:minus" class="text-xl" />
          </Button>
          <div class="text-3xl font-bold w-20 text-center">{formatTemperature(climate.attributes.temperature)}°</div>
          <Button color="alternative" pill class="!p-3 border-gray-800 dark:border-gray-50" on:click={() => setTemperature((climate.attributes.temperature || 20) + 0.5)}>
            <Icon icon="mdi:plus" class="text-xl" />
          </Button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Button color="alternative" class="border-gray-800 dark:border-gray-50 text-gray-800 dark:text-gray-50" on:click={toggleClimate}>
            {climate.state === 'off' ? 'Start' : 'Stop'}
          </Button>
          <button onclick={() => toggleSwitch(ids.teslaDefrost)} class="flex items-center justify-center gap-2 rounded-lg border border-gray-800 dark:border-gray-50 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors {defrost ? 'bg-gray-800 dark:bg-gray-50 text-gray-50 dark:text-gray-800' : ''}">
            <Icon icon="mdi:snowflake-melt" class="text-lg" />
            Defrost
          </button>
        </div>
      {/if}
    </div>

    <!-- 4. Security & Body -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon icon="mdi:shield-car" />
        Security & Body
      </h2>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <button onclick={() => toggleLock(ids.teslaLock, locked)} class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
          <div class="flex items-center gap-2">
            <Icon icon={locked ? 'mdi:lock' : 'mdi:lock-open-variant'} class="text-2xl" />
            <div>
              <div class="text-xs uppercase opacity-60 font-bold">Doors</div>
              <div class="font-bold">{locked ? 'Locked' : 'Unlocked'}</div>
            </div>
          </div>
        </button>
        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:cctv" class="text-2xl" />
            <div>
              <div class="text-xs uppercase opacity-60 font-bold">Sentry</div>
              <div class="font-bold">{sentry ? 'Armed' : 'Off'}</div>
            </div>
          </div>
          <Toggle checked={sentry} on:change={() => toggleSwitch(ids.teslaSentryMode)} />
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2 text-center text-xs">
        <div class="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <Icon icon={anyDoorOpen ? 'mdi:car-door' : 'mdi:car-door-lock'} class="text-2xl mx-auto {anyDoorOpen ? 'text-amber-500' : ''}" />
          <div class="opacity-60 mt-1">Doors</div>
          <div class="font-semibold">{anyDoorOpen ? 'Open' : 'Closed'}</div>
        </div>
        <div class="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <Icon icon={anyWindowOpen ? 'mdi:car-windshield-outline' : 'mdi:car-windshield'} class="text-2xl mx-auto {anyWindowOpen ? 'text-amber-500' : ''}" />
          <div class="opacity-60 mt-1">Windows</div>
          <div class="font-semibold">{anyWindowOpen ? 'Open' : 'Closed'}</div>
        </div>
        <div class="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <Icon icon="mdi:car" class="text-2xl mx-auto {frunk !== 'closed' ? 'text-amber-500' : ''}" />
          <div class="opacity-60 mt-1">Frunk</div>
          <div class="font-semibold capitalize">{frunk || '--'}</div>
        </div>
        <div class="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <Icon icon="mdi:car-back" class="text-2xl mx-auto {trunk !== 'closed' ? 'text-amber-500' : ''}" />
          <div class="opacity-60 mt-1">Trunk</div>
          <div class="font-semibold capitalize">{trunk || '--'}</div>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-sm">
        <div class="flex items-center gap-2">
          <Icon icon="mdi:ev-plug-tesla" class="text-xl" />
          <span>Charge Port</span>
        </div>
        <span class="font-bold">{chargePortOpen ? 'Open' : 'Closed'} · {portLocked ? 'Locked' : 'Unlocked'}</span>
      </div>
    </div>
  </div>
</div>
