<script lang="ts">
  import type { HourlyWeather } from '../providers/Provider';

  import HourlyLineChart from './primitives/HourlyLineChart.svelte';

  /* Properties */

  export let index: number;
  export let hourly: HourlyWeather[] = [];

  /* Constants */

  const DEFAULT_LIMITS = [2.5, 5, 10];

  /* Derived State */

  let units: string;
  let timestamps: Date[];
  let probabilities: number[];
  let amounts: number[];
  let limit: number;

  $: {
    units = 'mm';
    timestamps = hourly.map((h) => h.timestamp);
    probabilities = hourly.map((h) => h.precipitation_probability!);
    amounts = hourly.map((h) => h.precipitation_amount!);
    limit = ((max) => DEFAULT_LIMITS.find((lim) => max < lim) ?? max)(Math.max(...amounts));
  }
</script>

<HourlyLineChart
  uid="chart-precipitation-{index}"
  title="Precipitation (%, {units})"
  {timestamps}
  datasets={[
    {
      values: probabilities,
      limit: 100,
      valueFormatter: (value) => `${value.toFixed(0)}%`,
      tooltipFormatter: (value) => `${value.toFixed(0)}%`,
      style: {
        tickClass: 'fill-blue-600 dark:fill-blue-300',
        fillClass: 'fill-blue-500 dark:fill-blue-400 opacity-30',
        strokeClass: 'stroke-blue-600 dark:stroke-blue-300 stroke-[4] md:stroke-2',
        tooltipClass: 'text-blue-600 dark:text-blue-300',
        type: 'line',
        points: false,
        fill: true,
      },
    },
    {
      values: amounts,
      limit: limit,
      valueFormatter: (value) => `${value.toFixed(1)}`,
      tooltipFormatter: (value) => `${value.toFixed(1)} ${units}`,
      style: {
        tickClass: 'fill-green-600 dark:fill-green-300',
        fillClass: 'fill-green-500 dark:fill-green-400 [fill-opacity:30%]',
        strokeClass: 'stroke-green-600 dark:stroke-green-300 stroke-[4] md:stroke-2',
        tooltipClass: 'text-green-600 dark:text-green-300',
        type: 'bar',
        points: false,
        fill: true,
      },
    },
  ]}
/>
