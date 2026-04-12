<script lang="ts">
  import type { Weather } from '../providers/Provider';
  import CurrentDetails from './CurrentDetails.svelte';

  let { weather, onclick } = $props<{
    weather: Weather | undefined;
    onclick?: () => void;
  }>();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="w-full h-full bg-transparent p-6 transition-all rounded-2xl overflow-hidden flex flex-col justify-center"
  {onclick}
>
  {#if weather}
    <div class="w-full h-full">
       <CurrentDetails current={weather.current} {weather} mode="summary" class="h-full" />
    </div>
  {:else}
    <div class="flex items-center justify-center h-full text-gray-400">
      Loading weather...
    </div>
  {/if}
</div>
