<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchHistory } from '../HomeAssistant';
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

  interface HistoryEntry {
    entity_id: string;
    state: string;
    last_changed: string;
    last_updated: string;
    lu?: string;
    s?: string;
    parsedTime?: number;
  }

  let historyData = $state<{ [key: string]: HistoryEntry[] }>({});
  let loading = $state(true);
  let timestamps = $state<Date[]>([]);
  let apiError = $state('');

  function parseDate(val: string | number | undefined): Date {
    if (!val) return new Date(0);
    if (typeof val === 'number') return new Date(val * 1000);
    if (typeof val === 'string') {
        const clean = val.replace(/\+00:00$/, 'Z').replace(' ', 'T');
        const d = new Date(clean);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date(val);
  }

  async function loadData() {
    loading = true;
    apiError = '';
    
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    timestamps = Array.from({length: 25}, (_, i) => new Date(start.getTime() + i * 3600000));

    try {
      const ids = entities.map((e: { id: string }) => e.id);
      const data = await fetchHistory(ids, start, end);
      
      const newHistoryData: { [key: string]: HistoryEntry[] } = {};
      const processList = (list: HistoryEntry[]) => {
          return list.map(e => ({
              ...e,
              parsedTime: parseDate(e.lu || e.last_updated || e.last_changed).getTime()
          })).sort((a, b) => a.parsedTime! - b.parsedTime!);
      };

      if (data && typeof data === 'object') {
          if (!Array.isArray(data)) {
              Object.entries(data as Record<string, HistoryEntry[]>).forEach(([id, list]) => {
                  newHistoryData[id] = processList(list);
              });
          } else if (data.length > 0 && Array.isArray(data[0])) {
              (data as HistoryEntry[][]).forEach((list, index) => {
                  const id = ids[index];
                  if (id) newHistoryData[id] = processList(list);
              });
          }
      }
      historyData = newHistoryData;
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

  function processHistory(entityId: string, abs: boolean): number[] {
    const sorted = historyData[entityId] || [];
    if (sorted.length === 0) return Array(25).fill(0);

    let currentVal = 0;
    let dataIdx = 0;

    return timestamps.map(ts => {
      const targetTime = ts.getTime();
      
      while (dataIdx < sorted.length) {
        const entry = sorted[dataIdx];
        if (entry.parsedTime! <= targetTime) {
          const valStr = entry.s || entry.state;
          const parsed = parseFloat(valStr);
          if (!isNaN(parsed)) {
            currentVal = abs ? Math.abs(parsed) : parsed;
          }
          dataIdx++;
        } else {
          break;
        }
      }
      return currentVal;
    });
  }

  let datasets = $derived(entities.map((config: HistoryChartProps['entities'][0]) => {
    const values = processHistory(config.id, config.abs ?? false);
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
