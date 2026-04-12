<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Tooltip } from 'flowbite-svelte';
  import classNames from 'classnames';

  export let icon: string;
  export let label: string;
  export let isOn: boolean = false;
  export let onclick: () => void = () => {};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    role="button"
    tabindex="0"
    class="w-full h-full shadow-lg hover:shadow-xl active:scale-[0.97] rounded-2xl group transition-all duration-200 cursor-pointer"
    onclick={onclick}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
>
  <div 
      class={classNames(
          "w-full h-full backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all border overflow-hidden",
          isOn 
              ? "bg-gray-800 text-gray-50 dark:bg-gray-50 dark:text-gray-800 border-gray-800 dark:border-gray-50" 
              : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-50 hover:bg-black/5 dark:hover:bg-white/5 border-gray-200 dark:border-white/20"
      )}
  >
    <Icon {icon} id={`switch-icon-${label.replace(/\s+/g, '-').toLowerCase()}`} class="text-6xl mb-3" />
    <div class="text-[28px] font-bold uppercase tracking-wider">{label}</div>
    <Tooltip triggeredBy={`#switch-icon-${label.replace(/\s+/g, '-').toLowerCase()}`}>{label}: {isOn ? 'ON' : 'OFF'}</Tooltip>
  </div>
</div>
