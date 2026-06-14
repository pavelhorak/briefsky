<script lang="ts">
  import { entities } from '../HomeAssistant';
  import { configuration } from '../Configuration';
  import { onMount, onDestroy } from 'svelte';

  $: entity_id = $configuration.entityIds.camera;

  let timestamp = Date.now();
  let refreshInterval: number;

  $: cameraEntity = $entities[entity_id];
  
  // Try to use the pre-authorized entity_picture if available, otherwise construct proxy URL
  $: baseUrl = $configuration.haUrl.replace(/\/$/, '');
  $: entityPicture = cameraEntity?.attributes?.entity_picture;
  $: streamUrl = entityPicture 
    ? `${baseUrl}${entityPicture}&time=${timestamp}`
    : `${baseUrl}/api/camera_proxy/${entity_id}?access_token=${$configuration.haToken}&time=${timestamp}`;

  function refreshStream() {
    timestamp = Date.now();
  }

  onMount(() => {
    // Refresh every 2 seconds to simulate live video if it's a static proxy
    refreshInterval = setInterval(refreshStream, 2000);
  });

  onDestroy(() => {
    clearInterval(refreshInterval);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click|stopPropagation class="cursor-default max-w-[1500px] mx-auto px-2 py-0">
  <div class="bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 aspect-video flex items-center justify-center">
    <img 
        src={streamUrl} 
        alt="Camera Stream" 
        class="w-full h-full object-contain"
        on:error={() => {
            console.error('Camera stream failed to load');
            // Try refreshing once on error
            setTimeout(refreshStream, 2000);
        }}
    />
  </div>
</div>
