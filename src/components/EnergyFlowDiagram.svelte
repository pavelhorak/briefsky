<script lang="ts">
  import Icon from '@iconify/svelte';
  import { formatEnergy, formatPercentage } from '../Formatting';
  import { entities } from '../HomeAssistant';
  import { configuration } from '../Configuration';
  import {
    pvWatts,
    gridWatts,
    consumptionWatts,
    batteryWatts,
    batterySoc,
    batteryState,
    isGridImporting,
  } from '../EnergyState';

  /** When true: smaller nodes, no secondary labels — for the dashboard tile.
      When false: full-size nodes + status labels — for the details overlay. */
  export let compact: boolean = false;
  let className: string = '';
  export { className as class };

  /* SVG viewBox is 200x200; the four nodes sit at the midpoint of each edge,
     inset slightly so their HTML circles overlay them cleanly. */
  const SIZE = 200;
  const C = SIZE / 2;
  const EDGE_INSET = 32;          // distance from edge to node center (16% inset)

  const NODES = {
    solar:   { x: C,                  y: EDGE_INSET            },
    grid:    { x: EDGE_INSET,         y: C                     },
    battery: { x: SIZE - EDGE_INSET,  y: C                     },
    home:    { x: C,                  y: SIZE - EDGE_INSET     },
  } as const;

  const HUB_R = 6;
  const LINE_OFFSET_FROM_NODE = 22;  // line starts this far from node center
  const LINE_OFFSET_FROM_HUB  = HUB_R + 1;

  function makeLine(from: { x: number; y: number }) {
    const dx = C - from.x;
    const dy = C - from.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    return {
      x1: from.x + ux * LINE_OFFSET_FROM_NODE,
      y1: from.y + uy * LINE_OFFSET_FROM_NODE,
      x2: C - ux * LINE_OFFSET_FROM_HUB,
      y2: C - uy * LINE_OFFSET_FROM_HUB,
    };
  }

  type NodeKey = 'solar' | 'grid' | 'battery' | 'home';
  const LINES: Record<NodeKey, ReturnType<typeof makeLine>> = {
    solar:   makeLine(NODES.solar),
    grid:    makeLine(NODES.grid),
    battery: makeLine(NODES.battery),
    home:    makeLine(NODES.home),
  };
  const LINE_KEYS: NodeKey[] = ['solar', 'grid', 'battery', 'home'];

  /* Unique id suffix so multiple diagrams on one page don't share <path> ids
     (would break <animateMotion href="#..."/>). */
  const UID = Math.random().toString(36).slice(2, 8);
  const pathId = (k: NodeKey) => `eflow-${k}-${UID}`;

  /* Animation pacing: 5W → 5s/loop (slow), 5kW+ → 1.2s/loop (fast).
     Low threshold so even trickle imports/exports get visible dots. */
  const POWER_THRESHOLD = 5;
  function durationFromWatts(w: number): number {
    const c = Math.min(Math.max(w, POWER_THRESHOLD), 5000);
    const t = (c - POWER_THRESHOLD) / (5000 - POWER_THRESHOLD);
    return 5 - t * 3.8;
  }

  /* Flow direction.
     Each path is drawn FROM the node TOWARD the hub. So point 0 of the path
     sits at the node side, point 1 at the hub side.
       keyPoints="0;1"  → dot travels node → hub (toward center)
       keyPoints="1;0"  → dot travels hub  → node (away from center)
     Solar always produces (toward hub). Home always consumes (away from hub).
     Grid/battery direction depends on state. */
  $: solarFlow = {
    active: $pvWatts >= POWER_THRESHOLD,
    keyPoints: '0;1',           // solar → hub
    duration: durationFromWatts($pvWatts),
    color: 'text-gray-800 dark:text-gray-50',
  };
  $: homeFlow = {
    active: $consumptionWatts >= POWER_THRESHOLD,
    keyPoints: '1;0',           // hub → home
    duration: durationFromWatts($consumptionWatts),
    color: 'text-gray-800 dark:text-gray-50',
  };
  $: gridFlow = {
    active: Math.abs($gridWatts) >= POWER_THRESHOLD,
    keyPoints: $isGridImporting ? '0;1' : '1;0', // import: grid→hub, export: hub→grid
    duration: durationFromWatts(Math.abs($gridWatts)),
    color: 'text-gray-800 dark:text-gray-50',
  };
  $: batteryFlow = {
    active: $batteryWatts >= POWER_THRESHOLD && $batteryState !== 'idle',
    keyPoints: $batteryState === 'charging' ? '1;0' : '0;1', // charging: hub→battery, discharging: battery→hub
    duration: durationFromWatts($batteryWatts),
    color: 'text-gray-800 dark:text-gray-50',
  };

  $: solarVal   = formatEnergy($pvWatts);
  $: gridVal    = formatEnergy(Math.abs($gridWatts));
  $: batteryVal = formatEnergy($batteryWatts);
  $: homeVal    = formatEnergy($consumptionWatts);

  $: gridLabel = $isGridImporting ? 'Import' : 'Export';
  $: gridArrow = $isGridImporting ? 'mdi:arrow-down-bold' : 'mdi:arrow-up-bold';
  $: batteryArrow =
    $batteryState === 'charging' ? 'mdi:arrow-up-bold'
    : $batteryState === 'discharging' ? 'mdi:arrow-down-bold'
    : '';
  $: batteryLabel =
    $batteryState === 'charging'
      ? `Charging · ${batteryVal.value}${batteryVal.unit}`
      : $batteryState === 'discharging'
        ? `Discharging · ${batteryVal.value}${batteryVal.unit}`
        : 'Idle';

  /* Current stored energy in the battery (kWh) = SOC% × nominal capacity. */
  $: batteryCapacityKwh = (() => {
    const raw = parseFloat($entities[$configuration.entityIds.batteryCapacity]?.state ?? '');
    return Number.isFinite(raw) ? raw : null;
  })();
  $: batteryStoredKwh = batteryCapacityKwh != null ? (batteryCapacityKwh * $batterySoc) / 100 : null;

  /* Node circle sizing — tailwind classes per mode.
     Compact (tile) is ~2x larger than before so values are easily readable. */
  $: circleSize = compact
    ? 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24'
    : 'w-20 h-20 md:w-28 md:h-28';
  $: iconSize = compact
    ? 'text-4xl md:text-5xl lg:text-6xl'
    : 'text-5xl md:text-6xl';
  $: valueSize = compact ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-4xl';
  $: unitSize  = compact ? 'text-base md:text-lg lg:text-xl' : 'text-lg md:text-xl';
  $: labelSize = compact ? 'text-xs md:text-sm' : 'text-sm md:text-base';

  /* Node anchor percentage = SVG coord / SIZE * 100, applied via inline style. */
  function pctX(n: { x: number }) { return (n.x / SIZE) * 100; }
  function pctY(n: { y: number }) { return (n.y / SIZE) * 100; }
</script>

<div class="relative w-full h-full aspect-square {className}">
  <svg viewBox="0 0 {SIZE} {SIZE}" class="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    {#each LINE_KEYS as key (key)}
      {@const line = LINES[key]}
      {@const flow = key === 'solar' ? solarFlow : key === 'grid' ? gridFlow : key === 'battery' ? batteryFlow : homeFlow}
      <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            class="stroke-gray-300 dark:stroke-gray-600" stroke-width="1.2" stroke-linecap="round" />
      <path id={pathId(key)} d="M{line.x1},{line.y1} L{line.x2},{line.y2}" fill="none" stroke="none" />
      {#if flow.active}
        {#each [0, 0.5] as offset (offset)}
          <circle r="2.4" class="fill-current {flow.color}">
            <animateMotion
              dur="{flow.duration.toFixed(2)}s"
              repeatCount="indefinite"
              keyPoints={flow.keyPoints}
              keyTimes="0;1"
              begin="{(-offset * flow.duration).toFixed(2)}s"
            >
              <mpath href="#{pathId(key)}" />
            </animateMotion>
          </circle>
        {/each}
      {/if}
    {/each}
    <circle cx={C} cy={C} r={HUB_R} class="fill-gray-50 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" stroke-width="1" />
  </svg>

  <!-- HTML overlay nodes — positioned to match SVG node centers -->
  <div class="absolute inset-0 pointer-events-none">
    <!-- Solar (top node — text BELOW icon, toward center) -->
    <div class="absolute flex flex-col items-center" style="left:{pctX(NODES.solar)}%; top:{pctY(NODES.solar)}%; transform:translate(-50%, -50%);">
      <div class="{circleSize} rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
        <Icon icon="mdi:solar-power-variant" class="{iconSize} text-gray-800 dark:text-gray-50" />
      </div>
      <div class="text-center mt-0.5 leading-tight">
        <div class="font-semibold {valueSize}">{solarVal.value}<span class="{unitSize} opacity-70 ml-0.5">{solarVal.unit}</span></div>
        <div class="{labelSize} opacity-60 uppercase tracking-wide">Solar</div>
      </div>
    </div>

    <!-- Grid -->
    <div class="absolute flex flex-col items-center" style="left:{pctX(NODES.grid)}%; top:{pctY(NODES.grid)}%; transform:translate(-50%, -50%);">
      <div class="{circleSize} rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
        <Icon icon="mdi:transmission-tower" class="{iconSize} text-gray-800 dark:text-gray-50" />
      </div>
      <div class="text-center mt-0.5 leading-tight">
        <div class="font-semibold {valueSize} flex items-center justify-center gap-1">
          <Icon icon={gridArrow} class="{labelSize} text-gray-800 dark:text-gray-50" />
          <span>{gridVal.value}<span class="{unitSize} opacity-70 ml-0.5">{gridVal.unit}</span></span>
        </div>
        <div class="{labelSize} opacity-60 uppercase tracking-wide">{gridLabel}</div>
      </div>
    </div>

    <!-- Battery -->
    <div class="absolute flex flex-col items-center" style="left:{pctX(NODES.battery)}%; top:{pctY(NODES.battery)}%; transform:translate(-50%, -50%);">
      <div class="{circleSize} rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm relative overflow-hidden">
        <div class="absolute inset-0 bg-gray-500/20 dark:bg-gray-400/20"
             style="clip-path: inset({Math.max(0, 100 - $batterySoc)}% 0 0 0)"></div>
        <Icon icon="mdi:battery" class="{iconSize} text-gray-800 dark:text-gray-50 relative" />
      </div>
      <div class="text-center mt-0.5 leading-tight">
        <div class="font-semibold {valueSize}">{formatPercentage($batterySoc)}<span class="{unitSize} opacity-70 ml-0.5">%</span></div>
        {#if batteryArrow}
          <div class="{labelSize} opacity-80 flex items-center justify-center gap-0.5">
            <Icon icon={batteryArrow} class="text-gray-800 dark:text-gray-50" />
            <span>{batteryVal.value}{batteryVal.unit}</span>
          </div>
        {:else}
          <div class="{labelSize} opacity-60 uppercase tracking-wide">Idle</div>
        {/if}
        {#if batteryStoredKwh != null}
          <div class="{labelSize} opacity-60">{batteryStoredKwh.toFixed(1)}/{batteryCapacityKwh!.toFixed(1)} kWh</div>
        {/if}
      </div>
    </div>

    <!-- Home (bottom node — text ABOVE icon so it stays inside the tile) -->
    <div class="absolute flex flex-col-reverse items-center" style="left:{pctX(NODES.home)}%; top:{pctY(NODES.home)}%; transform:translate(-50%, -50%);">
      <div class="{circleSize} rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
        <Icon icon="mdi:home" class="{iconSize} text-gray-800 dark:text-gray-50" />
      </div>
      <div class="text-center mb-0.5 leading-tight">
        <div class="font-semibold {valueSize}">{homeVal.value}<span class="{unitSize} opacity-70 ml-0.5">{homeVal.unit}</span></div>
        <div class="{labelSize} opacity-60 uppercase tracking-wide">Home</div>
      </div>
    </div>
  </div>
</div>
