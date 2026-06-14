<script lang="ts">
  import EnergyFlowDiagram from './EnergyFlowDiagram.svelte';

  export let onclick: () => void = () => {};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  role="button"
  tabindex="0"
  {onclick}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
  class="w-full h-full bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg hover:shadow-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97] transition-all duration-200 cursor-pointer p-2 flex items-center justify-center"
>
  <EnergyFlowDiagram compact />
</div>
