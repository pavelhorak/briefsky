<script context="module" lang="ts">
  const CARDINAL_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  export function kphToMs(speed: number): number {
    return speed / 3.6;
  }

  export function degreesToCardinal(degrees: number): string {
    return CARDINAL_DIRECTIONS[Math.floor((degrees + 11.25) / 22.5) % 16];
  }
</script>

<script lang="ts">
  import classNames from 'classnames';
  import { Tooltip } from 'flowbite-svelte';
  import Icon from '@iconify/svelte';
  import { formatWindSpeed } from '../../Formatting';

  export let speed: number = 0;
  export let direction: number = 0;
  let className: string = '';
  export { className as iconClass };

  const uid = `wind-${Math.random().toString(36).substring(2, 9)}`;
  $: msValue = kphToMs(speed);
</script>

<span>{formatWindSpeed(msValue)} m/s</span>
<Icon
  id={uid}
  icon="wi:wind-deg"
  class={classNames('inline align-bottom ml-0.5', className || 'text-xl sm:text-2xl')}
  style={`transform: rotate(${(direction - 180).toFixed(0)}deg)`}
/>
<Tooltip triggeredBy={`#${uid}`}>{degreesToCardinal(direction)}</Tooltip>
