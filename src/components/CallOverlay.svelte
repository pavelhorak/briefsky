<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount, onDestroy } from 'svelte';

  export let name: string;
  export let url: string;
  export let onClose: () => void;

  let secondsLeft = 60;
  let interval: number;

  onMount(() => {
    interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) onClose();
    }, 1000);
  });

  onDestroy(() => clearInterval(interval));

  function callNow() {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
    onClose();
  }

  $: initial = (name || '?').charAt(0).toUpperCase();
  $: ready = !!url;
</script>

<div class="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-800 dark:text-gray-50 select-none">
  <div class="w-48 h-48 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-lg">
    <span class="text-9xl font-medium text-white">{initial}</span>
  </div>

  <div class="text-6xl font-medium mb-3">{name}</div>
  <div class="text-2xl opacity-60 mb-12">
    {#if ready}
      Calling…
    {:else}
      No call link set up yet.
    {/if}
  </div>

  <div class="flex gap-16">
    <button
      onclick={callNow}
      disabled={!ready}
      aria-label="Call"
      class="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center active:scale-95 transition shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Icon icon="mdi:phone" class="text-7xl text-white" />
    </button>
    <button
      onclick={onClose}
      aria-label="Cancel"
      class="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center active:scale-95 transition shadow-lg"
    >
      <Icon icon="mdi:phone-hangup" class="text-7xl text-white" />
    </button>
  </div>

  <div class="absolute bottom-6 text-sm opacity-40">Closes in {secondsLeft}s</div>
</div>
