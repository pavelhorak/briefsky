# Briefsky

Privacy-focused Home Automation Dashboard and Weather Station built with Svelte 5, TypeScript, and Tailwind CSS. Designed for local hosting (e.g., Home Assistant `www` folder) with responsive layouts for tablets in both landscape and portrait.

## Quick Reference

```bash
npm install          # Install dependencies
npm run dev          # Dev server with HMR
npm run build        # Production bundle
npm run format       # Prettier formatting
npm run lint         # ESLint
npm run check        # svelte-check type checking
```

### Deployment to Home Assistant

```bash
npm run build
scp -r dist/* root@homeassistant.local:/config/www/briefsky/
```

Note: HA serves static files with `Cache-Control: max-age=2678400` (31 days). After deploying, users must clear browser/PWA cache. The Settings page has a "Clear Cache" button. For Cloudflare tunnel access, the service worker filename must be changed on each deploy to bust the CDN cache (e.g., `sw.js` → `sw2.js` in `index.html`).

## Tech Stack

- **Framework**: Svelte 5 (with `$state`, `$effect`, `mount` API)
- **Language**: TypeScript 5
- **Build**: Vite 6 + vite-plugin-pwa
- **Styling**: Tailwind CSS 3 + Flowbite Svelte 0.47
- **Icons**: @iconify/svelte + custom SVGs in `icons/`
- **HA Integration**: home-assistant-js-websocket (WebSocket + REST API)
- **Weather**: Open-Meteo API (free, no key) + optional Ecowitt local station fusion

## Architecture

### Component Hierarchy

```
App.svelte                    — Root: routing, theme, refresh loop, inactivity timer, PWA install prompt
├── Dashboard.svelte          — Level 1: dual layout (landscape 16x10 grid / portrait flowing grid)
│   ├── WeatherSummaryTile    — 8x5 weather (temp, wind, humidity, dew point, sunrise/sunset)
│   ├── Calendar Tile         — 4x5 live clock (day, weekday, month, HH:mm)
│   ├── Control Tile          — 4x5 2x2 grid (Camera, Settings, Theme, Fireplace toggle)
│   ├── SensorTile            — Generic sensor tile (Climate, Energy, Tesla)
│   └── Switches Tile         — 4x5 2x2 grid (Garage light, Garage door, Outdoor light, Gate)
├── DetailsOverlay.svelte     — Shared overlay wrapper (click/swipe to close, compact mode for camera)
└── *Details.svelte           — Level 2: full-screen overlays (15s auto-close)
    ├── WeatherDetails        — Forecast, charts, daily summaries
    ├── TeslaDetails          — Vehicle status & climate control
    ├── EnergyFlowDetails     — Energy flow diagram, today stats, virtual battery, 24h charts (SolarDetails.svelte is unused legacy)
    ├── ClimateDetails        — HVAC controls (setpoint, DHW, water pressure)
    ├── CameraDetails         — MJPEG live stream (compact overlay)
    └── SettingsDetails       — Configuration panel + Clear Cache + Install App buttons
```

### Responsive Layouts

**Landscape** (min-aspect-ratio 4/3 AND min-width 976px):
- Fixed 16x10 grid filling full viewport
- Row 1 (rows 1-5): Weather 8x5 + Calendar 4x5 + Controls 4x5
- Row 2 (rows 6-10): Climate 4x5 + Energy 4x5 + Tesla 4x5 + Switches 4x5

**Portrait** (everything else):
- Flowing grid: `grid-cols-2 sm:grid-cols-3`
- Weather tile spans full width, other tiles are square with `aspect-square`
- Scrollable layout

### Key Patterns

- **Provider Pattern** (`src/providers/`): Weather services implement `ProviderFactory` + `Provider` interfaces. `OpenMeteoProvider` is the primary implementation.
- **Dual Weather Engine**: Open-Meteo forecast + Ecowitt real-time data fetched in parallel via `Promise.all()`, with Ecowitt values overriding forecast when available.
- **Configuration Persistence** (`src/Configuration.ts`): Stored in URL query params (shareable) or LocalStorage. Only non-default values are encoded. `haUrl` defaults to `window.location.origin` when empty.
- **Home Assistant** (`src/HomeAssistant.ts`): WebSocket for real-time entity state, REST API for 24h history charts. Service workers only work over HTTPS (Cloudflare tunnel) or localhost.
- **Formatting** (`src/Formatting.ts`): Centralized display rules — temperature (adaptive decimals), wind, percentage, energy (W/kW auto-scaling), kWh amounts. All formatters handle `null`/`undefined`/`NaN` gracefully, returning `'--'`.
- **Virtual Battery** (`src/VirtualBattery.ts`): Reproduces the utility's net-metering balance (`balance = statement balance + grid export − grid import`) from HA long-term statistics (`recorder/statistics_during_period`, monthly period) on the cumulative `inverter_total_energy_import/export` meters, topped up with live meter states. Seeded via `vbSeedDate`/`vbSeedBalance` config (Settings → Home Assistant tab), updated from each utility statement. Refreshes on HA connect + every 5 min. Balance shown in the landscape Energy tile header (battery icon + integer kWh) and as a card with monthly flows in EnergyFlowDetails. Validated against the June 2026 statement: inverter meters read ~1–2% above the distribution meter (balance within ~0.5%/month).
- **PWA Install**: `beforeinstallprompt` event captured in App.svelte, deferred prompt stored on `window.__briefsky_deferred_prompt`, triggered via "Install App" button in Settings.

### Design Standards

- **Metric units only**: Celsius, m/s, kPa, mm
- **Monochrome details pages**: No functional colors (red/green/blue) in Level 2 views
- **Color scheme**: Light = `bg-gray-50` / `text-gray-800`, Dark = `bg-gray-800` / `text-gray-50`
- **Active switch tiles**: Invert to opposite theme color
- **Grid**: 16-column custom Tailwind grid, `gap-2`, `p-2`, `rounded-2xl`
- **Touch feedback**: `active:scale-[0.97]` on tiles, swipe-down-to-close on detail overlays

### Icon & Text Sizes (Dashboard — 2x original)

**Weather Tile:**
| Element | Size |
|---------|------|
| Condition icon | component `size="large"` |
| Temperature | `text-8xl` / `text-[96px]` |
| Wind/Humidity/Dew point/Sunrise icons | `text-[34px]` |
| Wind direction icon | `text-[55px]` |
| Wind/Humidity/Dew point/Sunrise values | `text-[26px]` / `text-[28px]` |

**Calendar Tile:**
| Element | Size |
|---------|------|
| Day of month | `text-8xl` |
| Weekday / Month | `text-2xl` |
| Time (HH:mm) | `text-4xl` |

**Sensor Tiles (Climate, Energy, Tesla):**
| Element | Size |
|---------|------|
| Main icon | `text-6xl` (60px) |
| Sensor row icons | `text-[2.8em]` |
| Sensor values | `text-4xl` (36px) |
| Sensor units | `text-2xl` (24px) |

**Control Tile & Switches Tile:**
| Element | Size |
|---------|------|
| Icons | `text-6xl` (60px) |

### File Organization

```
src/
├── Configuration.ts          — Config store, enums, persistence
├── Formatting.ts             — Display formatting rules (null-safe)
├── HomeAssistant.ts          — HA WebSocket + REST integration
├── VirtualBattery.ts         — Utility net-metering balance from HA statistics (monthly reset)
├── providers/
│   ├── Provider.ts           — Interfaces (ProviderFactory, Provider, Weather types)
│   ├── Location.ts           — Location class, geolocation
│   ├── OpenMeteoProvider.ts  — Primary weather provider
│   └── index.ts              — Provider registry
├── geocoders/                — Location geocoding (Nominatim/OSM)
├── components/
│   ├── Dashboard.svelte      — Main grid layout (dual landscape/portrait)
│   ├── DetailsOverlay.svelte — Shared overlay (click/swipe to close)
│   ├── *Details.svelte       — Full-screen detail pages
│   ├── *Tile.svelte          — Dashboard tile components
│   └── primitives/           — Reusable building blocks
│       ├── SensorTile.svelte — Sensor tile template (centered content, max-w-[280px] rows)
│       ├── SwitchTile.svelte — Toggle tile template
│       ├── HourlyLineChart   — SVG chart (line + bar, multi-dataset)
│       └── Temperature, Wind, Pressure, etc. — Formatted value displays
```

## Conventions

- Line width: 160 characters (Prettier)
- Svelte 5 reactivity: `$state`, `$effect`, `$derived` — no legacy `$:` syntax
- Entity IDs are currently hardcoded in Dashboard.svelte and detail components
- Details pages must have `on:click|stopPropagation` on root element (background clicks close the overlay)
- PWA manifest and service worker generated by vite-plugin-pwa
- Build injects `window.__APP_VERSION__` and `window.__APP_COMMIT_ID__`
- Formatting functions must handle `null`/`undefined` — never call `.toFixed()` without a guard
