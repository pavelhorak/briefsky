<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchStatistics } from '../HomeAssistant';
  import HourlyLineChart from './primitives/HourlyLineChart.svelte';
  import { Spinner } from 'flowbite-svelte';

  interface HistoryChartProps {
    title: string;
    entities: {
      id: string;
      label: string;
      color: string;
      fill: string;
      type?: 'line' | 'bar';
      abs?: boolean;
      limit?: number;
    }[];
    height?: number;
    valueFormatter?: (v: number) => string;
    unit?: string;
  }

  let {
    title,
    entities,
    height = 300,
    valueFormatter = (v: number) => v.toFixed(1),
    unit = ''
  }: HistoryChartProps = $props();

  let bucketValues = $state<{ [key: string]: number[] }>({});
  let loading = $state(true);
  let timestamps = $state<Date[]>([]);
  let apiError = $state('');

  async function loadData() {
    loading = true;
    apiError = '';

    const now = new Date();
    const end = new Date(now);
    end.setUTCMinutes(0, 0, 0);
    end.setUTCHours(end.getUTCHours() + 1);
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    timestamps = Array.from({length: 25}, (_, i) => new Date(start.getTime() + i * 3600000));

    try {
      const ids = entities.map((e: { id: string }) => e.id);
      const data = await fetchStatistics(ids, start, end, 'hour');

      const next: { [key: string]: number[] } = {};
      for (const config of entities) {
        const rows = data[config.id] || [];
        const buckets: (number | undefined)[] = Array(25).fill(undefined);
        for (const row of rows) {
          const t = new Date(row.start).getTime();
          const idx = Math.round((t - start.getTime()) / 3600000);
          if (idx < 0 || idx >= 25) continue;
          const raw = row.mean ?? row.change ?? (row.state != null ? Number(row.state) : null);
          if (raw == null || Number.isNaN(Number(raw))) continue;
          buckets[idx] = config.abs ? Math.abs(Number(raw)) : Number(raw);
        }
        let last = 0;
        next[config.id] = buckets.map(v => {
          if (v !== undefined) last = v;
          return last;
        });
      }
      bucketValues = next;
    } catch (err: unknown) {
      const error = err as Error;
      apiError = `${error.name || 'Error'}: ${error.message || String(error)}`;
    } finally {
      loading = false;
    }
  }

  onMount(loadData);

  $effect(() => {
    if (entities) {
      loadData();
    }
  });

  let datasets = $derived(entities.map((config: HistoryChartProps['entities'][0]) => {
    const values = bucketValues[config.id] || Array(25).fill(0);
    const maxVal = Math.max(...values, config.limit || 100);
    return {
      values: values,
      limit: maxVal * 1.1,
      valueFormatter: (v: number) => `${valueFormatter(v)} ${unit}`,
      tooltipFormatter: (v: number) => `${config.label}: ${valueFormatter(v)} ${unit}`,
      style: {
        tickClass: config.color.replace('stroke', 'fill'),
        fillClass: `${config.fill} opacity-10`,
        strokeClass: `${config.color} stroke-[3]`,
        tooltipClass: config.color.replace('stroke', 'text'),
        type: config.type || 'line',
        points: false,
        fill: true
      }
    };
  }));
</script>

{#if loading}
    <div class="h-[{height}px] flex flex-col items-center justify-center gap-4">
        <Spinner size="12" color="yellow" />
        <div class="font-bold text-gray-400 tracking-widest uppercase text-xs">Fetching History...</div>
    </div>
{:else if apiError}
    <div class="h-[{height}px] flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-2xl text-red-400 gap-2 p-4 text-center">
        <div class="font-bold">FAILED TO LOAD HISTORY</div>
        <div class="text-[10px] break-all">{apiError}</div>
    </div>
{:else}
    <HourlyLineChart uid="sensor-chart-{title.replace(/\s+/g, '-').toLowerCase()}" {title} {timestamps} {datasets} {height} />
{/if}
