<script lang="ts">
  import { ConditionsIcon } from '../../providers/Provider';
  import Icon from '@iconify/svelte';

  export let value: ConditionsIcon;
  export let size: string = 'small';

  const ICON_MAP: { [key: number]: string } = {
    [ConditionsIcon.Clear]: 'wi:day-sunny',
    [ConditionsIcon.PartlyCloudy]: 'wi:day-cloudy',
    [ConditionsIcon.MostlyCloudy]: 'wi:cloudy',
    [ConditionsIcon.Overcast]: 'wi:cloudy',
    [ConditionsIcon.Fog]: 'wi:fog',
    [ConditionsIcon.LightRain]: 'wi:showers',
    [ConditionsIcon.Rain]: 'wi:rain',
    [ConditionsIcon.LightSleet]: 'wi:sleet',
    [ConditionsIcon.Sleet]: 'wi:sleet',
    [ConditionsIcon.LightSnow]: 'wi:snow',
    [ConditionsIcon.Snow]: 'wi:snow',
    [ConditionsIcon.Thunderstorm]: 'wi:thunderstorm',
    [ConditionsIcon.Unknown]: 'wi:na',
  };

  const ICON_ADJUSTMENT_MAP: { [key: string]: string } = {
    'wi:day-cloudy': size === 'small' ? 'top-0.5' : size === 'large' ? 'top-2' : 'top-4',
    'wi:fog': size === 'small' ? '-top-0.5' : size === 'large' ? '-top-2' : '-top-4',
    'wi:showers': size === 'small' ? '-top-0.5' : size === 'large' ? '-top-2' : '-top-4',
    'wi:rain': size === 'small' ? '-top-0.5' : size === 'large' ? '-top-2' : '-top-4',
    'wi:sleet': size === 'small' ? '-top-0.5' : size === 'large' ? '-top-2' : '-top-4',
    'wi:snow': size === 'small' ? '-top-0.5' : size === 'large' ? '-top-2' : '-top-4',
    'wi:thunderstorm': size === 'small' ? '-top-0.5' : size === 'large' ? '-top-2' : '-top-4',
  };

  /* Icon state */
  let icon: string;

  $: icon = ICON_MAP[value] ?? ICON_MAP[ConditionsIcon.Unknown];
</script>

<Icon
  {icon}
  class={`relative ${ICON_ADJUSTMENT_MAP[icon] ?? ''} ` +
    (size === 'small'
      ? 'text-[30px] sm:text-[36px] -my-1.5'
      : size === 'large'
        ? 'text-[96px] sm:text-[112px] -my-6'
        : 'text-[154px] sm:text-[180px] -my-10')}
/>
