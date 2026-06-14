<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Tooltip } from 'flowbite-svelte';
  import classNames from 'classnames';

    export let mainIcon: string;
    export let mainIconClass: string = "text-4xl text-gray-800 dark:text-gray-50";
    export let mainTooltip: string = "";
    
    export let sensors: {
      icon: string;
      iconClass?: string;
      tooltip?: string;
      value?: string | number;
      valueIcon?: string;
      valueIconClass?: string;
      unit?: string;
      id: string;
    }[] = [];

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
      class="w-full h-full bg-gray-50 dark:bg-gray-800 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/20 p-3 flex flex-col items-center justify-center gap-4 text-center hover:bg-black/5 dark:hover:bg-white/5 transition-all overflow-hidden"
  >      <div class="flex flex-col items-center">
        <Icon icon={mainIcon} id={`main-icon-${mainIcon.replace(/[:]/g, '-')}`} class={mainIconClass} />
        {#if mainTooltip}
          <Tooltip triggeredBy={`#main-icon-${mainIcon.replace(/[:]/g, '-')}`}>{mainTooltip}</Tooltip>
        {/if}
      </div>
      
      <div class="flex flex-col items-center w-full max-w-[280px] gap-2 px-2">
        {#each sensors as sensor}
          <div class="flex items-center justify-between w-full text-gray-800 dark:text-gray-50">
            <Icon icon={sensor.icon} id={sensor.id} class={classNames("text-[2.8em]", sensor.iconClass || "text-gray-800 dark:text-gray-50")} />
            {#if sensor.tooltip}
              <Tooltip triggeredBy={`#${sensor.id}`}>{sensor.tooltip}</Tooltip>
            {/if}
            <div class="font-bold flex items-center text-nowrap">
              {#if sensor.valueIcon}
                <Icon icon={sensor.valueIcon} class={classNames("text-[2.8em]", sensor.valueIconClass || "text-gray-800 dark:text-gray-50")} />
              {:else}
                <span class="text-4xl">{sensor.value}</span>
              {/if}
              {#if sensor.unit}
                <small class="text-2xl ml-1">{sensor.unit}</small>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
