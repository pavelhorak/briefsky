<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';
  import Icon from '@iconify/svelte';
  import type { CurrentWeather, Weather } from '../providers/Provider';

  import Conditions from './primitives/Conditions.svelte';
  import ConditionsIcon from './primitives/ConditionsIcon.svelte';
  import Temperature from './primitives/Temperature.svelte';
  import Wind from './primitives/Wind.svelte';
  import RelativeHumidity from './primitives/RelativeHumidity.svelte';
  import UVIndex from './primitives/UVIndex.svelte';
  import Distance from './primitives/Distance.svelte';
  import Pressure from './primitives/Pressure.svelte';
  import LocalIcon from './primitives/LocalIcon.svelte';
  import Timestamp from './primitives/Timestamp.svelte';

  export let current: CurrentWeather;
  export let weather: Weather | undefined = undefined;
  export let mode: 'summary' | 'details' = 'details';

  let className: string = '';
  export { className as class };

  $: nextSunEvent =
    weather && current
      ? current.timestamp < weather.daily[0].sunrise_timestamp
        ? { type: 'sunrise', timestamp: weather.daily[0].sunrise_timestamp, icon: 'mingcute:sunrise-line' }
        : current.timestamp < weather.daily[0].sunset_timestamp
          ? { type: 'sunset', timestamp: weather.daily[0].sunset_timestamp, icon: 'mingcute:sunset-fill' }
          : weather.daily[1]
            ? { type: 'sunrise', timestamp: weather.daily[1].sunrise_timestamp, icon: 'mingcute:sunrise-line' }
            : undefined
      : undefined;
</script>

<div class={className}>
  {#if current}
    {#if mode === 'summary'}
      <div class="flex flex-col items-center justify-center h-full">
        <div class="flex items-center justify-center gap-2 mb-8">
          <div><ConditionsIcon size="large" value={current.conditions_icon} /></div>
          <div class="text-8xl sm:text-[96px] font-bold"><Temperature value={current.temperature} /></div>
        </div>

        <div class="flex flex-col items-center gap-2 w-full px-4">
          <div class="flex items-center gap-1.5">
            <LocalIcon id="icon-wind-sum" name="wind" class="text-[34px]" />
            <Tooltip triggeredBy="#icon-wind-sum">Wind</Tooltip>
            <div class="text-[26px] sm:text-[28px] font-bold flex items-center text-nowrap">
              <Wind speed={current.wind_speed} direction={current.wind_direction} iconClass="text-[55px]" />
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <LocalIcon id="icon-humidity-sum" name="humidity" class="text-[34px]" />
            <Tooltip triggeredBy="#icon-humidity-sum">Humidity</Tooltip>
            <div class="text-[26px] sm:text-[28px] font-bold flex items-center text-nowrap">
              <RelativeHumidity value={current.relative_humidity} />
            </div>
            <div class="w-3"></div>
            <LocalIcon id="icon-dewpoint-sum" name="dew-point" class="text-[34px]" />
            <Tooltip triggeredBy="#icon-dewpoint-sum">Dew Point</Tooltip>
            <div class="text-[26px] sm:text-[28px] font-bold flex items-center text-nowrap">
              <Temperature value={current.dew_point_temperature} />
            </div>
            {#if nextSunEvent}
              <div class="w-3"></div>
              <Icon id="icon-sun-event-sum" icon={nextSunEvent.icon} class="text-[34px]" />
              <Tooltip triggeredBy="#icon-sun-event-sum">{nextSunEvent.type === 'sunrise' ? 'Sunrise' : 'Sunset'}</Tooltip>
              <div class="text-[26px] sm:text-[28px] font-bold flex items-center text-nowrap">
                <Timestamp format="time" value={nextSunEvent.timestamp} />
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="grid grid-rows-2 grid-flow-col justify-center items-center mt-2 mb-4">
        <div class="row-span-2 mr-2"><ConditionsIcon size="large" value={current.conditions_icon} /></div>
        <div><span class="text-2xl sm:text-4xl font-semibold"><Temperature value={current.temperature} /> <Conditions value={current.conditions} /></span></div>
        <div class="flex gap-2">
          <div><span class="font-semibold">Feels Like:</span> <Temperature value={current.feels_like_temperature} /></div>
          <div><span class="font-semibold">Low:</span> <Temperature value={current.temperature_low} /></div>
          <div><span class="font-semibold">High:</span> <Temperature value={current.temperature_high} /></div>
        </div>
      </div>
      <div
        class="grid grid-cols-2 place-items-stretch md:grid-cols-3 lg:grid-cols-none lg:grid-flow-col lg:justify-center w-5/6 lg:w-full gap-2 lg:gap-8 mx-auto lg:mx-0"
      >
        <div class="flex items-center gap-1.5">
          <LocalIcon id="icon-wind-det" name="wind" class="text-gray-500 dark:text-white" />
          <Tooltip triggeredBy="#icon-wind-det">Wind</Tooltip>
          <Wind speed={current.wind_speed} direction={current.wind_direction} />
        </div>
        <div class="flex items-center gap-1.5">
          <LocalIcon id="icon-humidity-det" name="humidity" class="text-gray-500 dark:text-white" />
          <Tooltip triggeredBy="#icon-humidity-det">Humidity</Tooltip>
          <RelativeHumidity value={current.relative_humidity} />
        </div>
        <div class="flex items-center gap-1.5">
          <LocalIcon id="icon-dew-point-det" name="dew-point" class="text-gray-500 dark:text-white" />
          <Tooltip triggeredBy="#icon-dew-point-det">Dew Point</Tooltip>
          <Temperature value={current.dew_point_temperature} />
        </div>
        {#if current.uv_index !== undefined}
          <div class="flex items-center gap-1.5">
            <span class="font-semibold">UV Index:</span> <UVIndex value={current.uv_index} />
          </div>
        {/if}
        {#if current.visibility !== undefined}
          <div class="flex items-center gap-1.5">
            <LocalIcon id="icon-visibility-det" name="visibility" class="text-gray-500 dark:text-white" />
            <Tooltip triggeredBy="#icon-visibility-det">Visibility</Tooltip>
            <Distance value={current.visibility} />
          </div>
        {/if}
        <div class="flex items-center gap-1.5">
          <LocalIcon id="icon-pressure-det" name="pressure" class="text-gray-500 dark:text-white" />
          <Tooltip triggeredBy="#icon-pressure-det">Pressure</Tooltip>
          <Pressure value={current.pressure} />
        </div>
        {#if nextSunEvent}
          <div class="flex items-center gap-1.5">
            <Icon id="icon-sun-event-det" icon={nextSunEvent.icon} class="text-gray-500 dark:text-white text-xl" />
            <Tooltip triggeredBy="#icon-sun-event-det">{nextSunEvent.type === 'sunrise' ? 'Sunrise' : 'Sunset'}</Tooltip>
            <Timestamp format="time" value={nextSunEvent.timestamp} />
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
