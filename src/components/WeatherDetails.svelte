<script lang="ts">
  import { Alert, Accordion, AccordionItem, Skeleton, ListPlaceholder } from 'flowbite-svelte';
  import Icon from '@iconify/svelte';
  import classNames from 'classnames';

  import type { Weather } from '../providers/Provider';
  import { AutoExpand, Layout, configuration } from '../Configuration';

  import CurrentDetails from './CurrentDetails.svelte';
  import DailySummary from './DailySummary.svelte';
  import DailyDetails from './DailyDetails.svelte';
  import HourlyDetails from './HourlyDetails.svelte';
  import HourlyWindChart from './HourlyWindChart.svelte';
  import HourlyPrecipitationChart from './HourlyPrecipitationChart.svelte';

  export let weather: Weather | undefined;
  export let error: string | undefined;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click|stopPropagation class={classNames('cursor-default mx-auto', $configuration.layout === Layout.Split ? 'max-w-[1464px] px-4' : 'container')}>
  {#if weather}
    <div class="mb-4 md:mb-6 px-6">
      <CurrentDetails current={weather.current} {weather} mode="details" />
    </div>

    <div class={$configuration.layout === Layout.Split ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 items-start' : ''}>
      <div class={$configuration.layout === Layout.Split ? '' : ''}>
        <div class="mb-6 grid gap-y-4 px-6">
          <HourlyDetails hourly={weather.current.hourly} />
          {#if weather.current.hourly[0].precipitation_probability !== undefined && $configuration.showHourlyPrecipitation}
            <HourlyPrecipitationChart index={999} hourly={weather.current.hourly} />
          {/if}
          {#if weather.current.hourly[0].wind_speed !== undefined && $configuration.showHourlyWind}
            <HourlyWindChart index={999} hourly={weather.current.hourly} />
          {/if}
        </div>
      </div>

      {#if $configuration.layout === Layout.Split}
        <div class="space-y-4">
          <Accordion
            multiple
            classActive="text-inherit dark:text-inherit bg-gray-100 dark:bg-gray-700 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800"
            classInactive="text-inherit dark:text-inherit hover:bg-gray-100 hover:dark:bg-gray-700"
            defaultClass="text-inherit dark:text-inherit w-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700"
          >
            {#each weather.daily as daily, i}
              <AccordionItem
                defaultClass="flex items-center justify-between w-full font-medium text-left group-first:rounded-t-xl !py-2"
                paddingDefault="py-2 px-6"
                open={false}
              >
                <div slot="arrowup"></div>
                <div slot="arrowdown"></div>
                <DailySummary
                  slot="header"
                  class="grow"
                  current={weather.current}
                  {daily}
                  global_low={Math.min(...weather.daily.map((d) => d.temperature_low))}
                  global_high={Math.max(...weather.daily.map((d) => d.temperature_high))}
                />
                <div class="grid gap-y-4 mb-2">
                  <DailyDetails {daily} />
                  <HourlyDetails hourly={daily.hourly} />
                  {#if daily.hourly[0].precipitation_probability !== undefined && $configuration.showHourlyPrecipitation}
                    <HourlyPrecipitationChart index={i} hourly={daily.hourly} />
                  {/if}
                  {#if daily.hourly[0].wind_speed !== undefined && $configuration.showHourlyWind}
                    <HourlyWindChart index={i} hourly={daily.hourly} />
                  {/if}
                </div>
              </AccordionItem>
            {/each}
          </Accordion>
        </div>
      {/if}
    </div>

    {#if $configuration.layout === Layout.Normal}
      <div>
        <Accordion
          multiple
          classActive="text-inherit dark:text-inherit bg-gray-100 dark:bg-gray-700 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800"
          classInactive="text-inherit dark:text-inherit hover:bg-gray-100 hover:dark:bg-gray-700"
          defaultClass="text-inherit dark:text-inherit w-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700"
        >
          {#each weather.daily as daily, i}
            {@const nextHourly = weather.daily[i + 1]
              ? weather.daily[i + 1].hourly.find((h) => h.timestamp > daily.hourly[daily.hourly.length - 1].timestamp)
              : undefined}
            <AccordionItem
              defaultClass="flex items-center justify-between w-full font-medium text-left group-first:rounded-t-xl !py-3 md:!py-4"
              paddingDefault="py-4 px-6"
              open={$configuration.autoexpand === AutoExpand.All || (i === 0 && $configuration.autoexpand === AutoExpand.Today)}
            >
              <div slot="arrowup"></div>
              <div slot="arrowdown"></div>
              <DailySummary
                slot="header"
                class="grow"
                current={weather.current}
                {daily}
                global_low={Math.min(...weather.daily.map((d) => d.temperature_low))}
                global_high={Math.max(...weather.daily.map((d) => d.temperature_high))}
              />
              <div class="grid gap-y-4 mb-2">
                <DailyDetails {daily} />
                <HourlyDetails hourly={nextHourly ? [...daily.hourly, nextHourly] : daily.hourly} />
                {#if daily.hourly[0].precipitation_probability !== undefined && $configuration.showHourlyPrecipitation}
                  <HourlyPrecipitationChart index={i} hourly={nextHourly ? [...daily.hourly, nextHourly] : daily.hourly} />
                {/if}
                {#if daily.hourly[0].wind_speed !== undefined && $configuration.showHourlyWind}
                  <HourlyWindChart index={i} hourly={nextHourly ? [...daily.hourly, nextHourly] : daily.hourly} />
                {/if}
              </div>
            </AccordionItem>
          {/each}
        </Accordion>
      </div>
    {/if}
  {:else if error}
    <Alert color="red" class="text-lg w-3/4 my-6 mx-auto dark:text-gray-200 dark:bg-red-800">
      <span slot="icon"><Icon icon="mdi:error-outline" class="text-2xl" /></span>
      <span class="font-semibold">Error fetching weather:</span>
      {error}
    </Alert>
  {:else}
    <div class="my-6">
      <Skeleton divClass="mx-auto !max-w-full !w-3/4" />
    </div>
    <div class="my-6">
      <ListPlaceholder divClass="mx-auto !max-w-full !w-full" />
    </div>
  {/if}
</div>
