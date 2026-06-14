<script lang="ts">
  import { onMount } from 'svelte';
  import { Spinner } from 'flowbite-svelte';
  import { configuration } from '../Configuration';
  import HourlyLineChart from './primitives/HourlyLineChart.svelte';

  let loading = true;
  let errorMsg = '';
  let timestamps: Date[] = [];
  let temps: number[] = Array(25).fill(NaN);
  let rains: number[] = Array(25).fill(0);
  let minTemp: number | null = null;
  let maxTemp: number | null = null;
  let totalRain = 0;

  function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function pickRainfallRateList(data: any): Record<string, string> {
    return data?.rainfall_piezo?.rain_rate?.list || data?.rainfall?.rain_rate?.list || {};
  }

  async function load() {
    const config = $configuration;
    if (!config.useEcowitt || !config.ecowittApiKey || !config.ecowittAppKey || !config.ecowittMac) {
      errorMsg = 'Ecowitt not configured';
      loading = false;
      return;
    }

    const now = new Date();
    const end = new Date(now);
    end.setMinutes(0, 0, 0);
    end.setHours(end.getHours() + 1);
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    timestamps = Array.from({ length: 25 }, (_, i) => new Date(start.getTime() + i * 3600000));

    const params = new URLSearchParams({
      application_key: config.ecowittAppKey,
      api_key: config.ecowittApiKey,
      mac: config.ecowittMac,
      start_date: fmtDate(start),
      end_date: fmtDate(end),
      call_back: 'outdoor,rainfall_piezo,rainfall',
      cycle_type: 'auto',
      temp_unitid: '1',
      rainfall_unitid: '12',
    });

    try {
      const res = await fetch(`https://api.ecowitt.net/api/v3/device/history?${params.toString()}`);
      const json = await res.json();
      if (json.code !== 0) {
        errorMsg = `Ecowitt: ${json.msg || 'unknown error'}`;
        loading = false;
        return;
      }

      const tempList: Record<string, string> = json.data?.outdoor?.temperature?.list || {};
      const rateList: Record<string, string> = pickRainfallRateList(json.data);

      const tempBuckets: number[][] = Array.from({ length: 25 }, () => []);
      for (const [ts, v] of Object.entries(tempList)) {
        const t = parseInt(ts) * 1000;
        const idx = Math.floor((t - start.getTime()) / 3600000);
        if (idx < 0 || idx >= 25) continue;
        const val = parseFloat(v as string);
        if (!isNaN(val)) tempBuckets[idx].push(val);
      }
      const tempArr = tempBuckets.map(b => (b.length > 0 ? b.reduce((a, x) => a + x, 0) / b.length : NaN));
      let last = NaN;
      temps = tempArr.map(v => {
        if (!isNaN(v)) last = v;
        return last;
      });

      // Average rain_rate (mm/h) within each hour bucket = mm fallen during that hour.
      const rateBuckets: number[][] = Array.from({ length: 25 }, () => []);
      for (const [ts, v] of Object.entries(rateList)) {
        const t = parseInt(ts) * 1000;
        const idx = Math.floor((t - start.getTime()) / 3600000);
        if (idx < 0 || idx >= 25) continue;
        const val = parseFloat(v as string);
        if (!isNaN(val)) rateBuckets[idx].push(val);
      }
      rains = rateBuckets.map(b => (b.length > 0 ? b.reduce((a, x) => a + x, 0) / b.length : 0));

      const valid = temps.filter(t => !isNaN(t));
      if (valid.length > 0) {
        minTemp = Math.min(...valid);
        maxTemp = Math.max(...valid);
      }
      totalRain = rains.reduce((a, b) => a + b, 0);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const TEMP_LIMITS = [10, 20, 30, 40];
  const RAIN_LIMITS = [2.5, 5, 10];

  $: tempMaxRaw = Math.max(...temps.filter(t => !isNaN(t)), 0);
  $: tempMinRaw = Math.min(...temps.filter(t => !isNaN(t)), 0);
  $: tempLimit = TEMP_LIMITS.find(l => tempMaxRaw < l) ?? Math.ceil(tempMaxRaw);
  $: tempFloor = tempMinRaw < 0 ? Math.floor(tempMinRaw / 5) * 5 : 0;
  $: tempRange = tempLimit - tempFloor;
  $: tempValuesShifted = temps.map(t => (isNaN(t) ? NaN : t - tempFloor));
  $: rainLimit = RAIN_LIMITS.find(l => Math.max(...rains) < l) ?? Math.ceil(Math.max(...rains));

  $: title = (() => {
    if (loading || errorMsg) return 'History (°C, mm)';
    const minStr = minTemp !== null ? `${minTemp.toFixed(1)}°` : '--';
    const maxStr = maxTemp !== null ? `${maxTemp.toFixed(1)}°` : '--';
    const rainStr = totalRain > 0 ? `, ${totalRain.toFixed(1)} mm` : '';
    return `History (°C, mm) · Min ${minStr} / Max ${maxStr}${rainStr}`;
  })();
</script>

{#if loading}
  <div class="h-[200px] flex flex-col items-center justify-center gap-3">
    <Spinner size="8" color="yellow" />
    <div class="font-bold text-gray-400 tracking-widest uppercase text-xs">Loading 24h History...</div>
  </div>
{:else if errorMsg}
  <div class="h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-2xl text-red-400 gap-2 p-4 text-center">
    <div class="font-bold text-sm">FAILED TO LOAD HISTORY</div>
    <div class="text-[10px] break-all">{errorMsg}</div>
  </div>
{:else}
  <HourlyLineChart
    uid="chart-history-24h"
    {title}
    {timestamps}
    datasets={[
      {
        values: tempValuesShifted,
        limit: tempRange,
        valueFormatter: (v: number) => `${(v + tempFloor).toFixed(0)}°`,
        tooltipFormatter: (v: number) => `${(v + tempFloor).toFixed(1)} °C`,
        style: {
          tickClass: 'fill-orange-600 dark:fill-orange-300',
          fillClass: 'fill-orange-500 dark:fill-orange-400 [fill-opacity:20%]',
          strokeClass: 'stroke-orange-600 dark:stroke-orange-300 stroke-[4] md:stroke-2',
          tooltipClass: 'text-orange-600 dark:text-orange-300',
          type: 'line',
          points: false,
          fill: true,
        },
      },
      {
        values: rains,
        limit: rainLimit,
        valueFormatter: (v: number) => v.toFixed(1),
        tooltipFormatter: (v: number) => `${v.toFixed(1)} mm`,
        style: {
          tickClass: 'fill-blue-600 dark:fill-blue-300',
          fillClass: 'fill-blue-500 dark:fill-blue-400 [fill-opacity:30%]',
          strokeClass: 'stroke-blue-600 dark:stroke-blue-300 stroke-[4] md:stroke-2',
          tooltipClass: 'text-blue-600 dark:text-blue-300',
          type: 'bar',
          points: false,
          fill: true,
        },
      },
    ]}
  />
{/if}
