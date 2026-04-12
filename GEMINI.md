# GEMINI.md - Briefsky Project Overview

## Project Description
Briefsky is a modern, privacy-focused Home Automation Dashboard and Weather Station. It is designed to be hosted locally (e.g., in a Home Assistant `www` folder) and provides a real-time, 16x10 grid-based interface for monitoring sensor data, Tesla status, Solar performance, and weather conditions.

## Global Standards

### Design Principles
- **Monochrome Details**: Detail Pages (Level 2) should adhere to a strict monochrome/grayscale aesthetic. Avoid functional colors (red/green/blue) in these views to maintain a clean, high-contrast look.
- **Visual Feedback**: Use high-contrast background inversions (Black/White) for active states rather than colors.

### Formatting Rules
To maintain a clean and consistent interface, the following rules are enforced via `src/Formatting.ts`:
- **Temperature (°C)**: Show 1 decimal place if the absolute value is < 10, otherwise 0 decimals (e.g., `8.5°`, `22°`). Handles both string and number inputs; returns `--` for invalid data.
- **Wind Speed (m/s)**: Show 1 decimal place if the absolute value is < 10, otherwise 0 decimals.
- **Percentage (%)**: Always show 0 decimal places.
- **Energy (W/kW)**: 
    - If absolute value >= 1000W: Show 1 decimal place and use **kW** unit (e.g., `1.2 kW`).
    - If absolute value < 1000W: Show 0 decimal places and use **W** unit (e.g., `850 W`).

### Metric Standard
The application is standardized to Metric units (Celsius, m/s, kPa, mm).

### Color Standard
- **Backgrounds**: The application uses a standardized background color scheme to ensure a seamless transition between the Dashboard and Details pages:
    - **Light Mode**: `rgb(249 250 251)` (`bg-gray-50`)
    - **Dark Mode**: `rgb(31 41 55)` (`bg-gray-800`)
- **Text & Icons**: To ensure maximum contrast and a clean monochrome look, all text and icons (except on the Weather Details page) must use the background color of the **opposite** mode:
    - **Light Mode**: Use `gray-800` for text and icons.
    - **Dark Mode**: Use `gray-50` for text and icons.
- **Tiles**: All non-active tiles must match their respective background color (`bg-gray-50` / `bg-gray-800`) to create a unified surface.

## Terminology Reference
To ensure consistent communication, use the following terms:

### Navigation & Pages
- **Dashboard**: The main page (Level 1) featuring the 16x10 grid.
- **Details Page**: Any full-screen view (Level 2) that opens when a tile is clicked.
    - **Monochrome Policy**: Detail Pages must adhere to a strict monochrome/grayscale aesthetic. No functional colors (red/green/blue) should be used for icons, badges, or buttons.
    - **Closing Behavior**: 
        - **Automatic**: Details pages automatically close after 15 seconds of inactivity.
        - **Manual**: Clicking literally anywhere outside the main content area returns to the Dashboard.
        - **Implementation**: Every details component must have `on:click|stopPropagation` and `cursor-default` on its root element to allow background clicks to bubble up to the close handler in `App.svelte`.
    - **Current details pages**:
        - **Weather Details**: Full forecast, charts, and daily summaries.
        - **Tesla Details**: Detailed vehicle status and climate controls.
        - **Solar Details**: 24-hour performance charts for solar, load, and grid power.
        - **Climate Details**: Interactive controls for HVAC and Fireplace mode.
        - **Camera Details**: Live MJPEG video stream from Home Assistant.
        - **Settings Page**: Full-screen configuration view.

### Grid & Layout
- **Grid**: The overall 16x10 system on the Dashboard.
    - **Spacing**: Uses a compact `gap-2` and `p-2` (outer padding) to optimize space on tablet resolutions.
- **Tile**: An individual block within the Grid.
- **Weather Tile**: The specific 6x3 summary block on the Dashboard.
- **Sensor Tile**: A generic 3x3 block template used for Tesla, Solar, and Climate data. 
    - **Layout**: Top-aligned main icon (`text-3xl`) with optional tooltip, and up to 3 sensor rows at the bottom.
    - **Alignment**: Each row uses "justify-between" (Icon on Left `text-[1.4em]`, Value on Right `text-lg`).
- **Switch Tile**: A 3x3 block template for single-switch controls (e.g., Garage Light).
    - **Visuals**: Icon size `text-3xl`, Label size `text-sm`.
    - **Status Indication**: Inverts background to the **opposite theme color** when ON (becomes `bg-gray-800` in Light mode, `bg-gray-50` in Dark mode).
- **Control Tile**: The 1x3 block (top-right) containing Camera, Settings and Theme buttons with `text-xl` icons.

## Features & Integration
- **Theme Toggle**: Logic/button switching between Light, Dark, and System modes. Supports global state.
- **HA Integration**: WebSocket connection for real-time states and REST API for history data.
- **Ecowitt Integration**: Merges real-time local station data (temp, wind, humidity, pressure, UVI) with Open-Meteo forecasts. Toggleable in settings.
- **Solar Backup Logic**: Automatically falls back to Emporia Vue sensors (`sensor.vue_123_1min`) for Consumption and Grid data if the Inverter load sensor is `0`, `unavailable`, or missing.
- **Entity**: A specific sensor or device from Home Assistant.

## Key Architectural Patterns
- **Provider Pattern**: Weather services are abstracted behind interfaces.
- **Dual Weather Engine**: Concurrent fetching from Open-Meteo (forecast) and Ecowitt (real-time measurements) when configured.
- **Real-time Synchronization**: HA entities are synchronized via WebSocket.
- **History Fetching**: Standardized on HA REST API (`/api/history/period`) for 24h performance charts. Uses robust date parsing to handle both ISO strings and Unix timestamps.
- **Generic Component Templates**:
    - `SensorTile.svelte`: Standardizes the 3x3 dashboard tiles with top-aligned main icons and left/right aligned sensor data rows. Supports tooltips and status-specific icons.
    - `SwitchTile.svelte`: A 3x3 dashboard tile template for single switches. When **ON**, the tile background turns black (light mode) or white (dark mode) for high-visibility status indication.
    - `SensorHistoryChart.svelte`: Reusable component for visualizing 24h history with automatic scaling and magnitude-aware unit formatting.
- **Grid-based Layout**: Utilizes a custom 16-column Tailwind grid with a visible dotted guide for empty tiles.
- **State Persistence**: Configuration supports LocalStorage and URL persistence.

## Home Assistant Setup (CORS)
To allow the dashboard to fetch history data via the REST API, you must enable CORS in your Home Assistant `configuration.yaml`:

```yaml
http:
  cors_allowed_origins:
    - http://localhost:5174
    - https://ha.pavelhorak.com
```
*Restart Home Assistant after making changes.*

## Core Technologies
- **Framework:** Svelte 5 (using modern `mount` API, but standard component syntax)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Flowbite Svelte
- **Icons:** Iconify (@iconify/svelte) and custom Local SVGs.
- **Integration:** `home-assistant-js-websocket` + REST API.
- **Build Tool:** Vite
- **Utilities:** `classnames` for dynamic class management.

## Development Workflow
- **Install dependencies:** `npm install`
- **Run development server:** `npm run dev`
- **Build for production:** `npm install && npm run build`
- **Format code:** `npm run format`
- **Lint code:** `npm run lint`
- **Type check:** `npm run check`