<script lang="ts">
  import EnergyFlowDiagram from './EnergyFlowDiagram.svelte';
  import Icon from '@iconify/svelte';
  import { isInverterOffline } from '../EnergyState';

  export let onclick: () => void = () => {};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  role="button"
  tabindex="0"
  {onclick}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
  class="relative w-full h-full bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg hover:shadow-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97] transition-all duration-200 cursor-pointer p-2 flex items-center justify-center"
>
  <div class:opacity-30={$isInverterOffline} class="w-full h-full flex items-center justify-center transition-opacity">
    <EnergyFlowDiagram compact />
  </div>
  {#if $isInverterOffline}
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
      <Icon icon="mdi:lan-disconnect" class="text-3xl opacity-70" />
      <span class="text-xs uppercase tracking-widest opacity-70">Inverter offline</span>
    </div>
  {/if}
</div>
