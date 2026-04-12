<script lang="ts">
  import { onMount } from 'svelte';
  import { configuration } from './Configuration';
  import { connect } from './HomeAssistant';

  import type { Provider, Weather } from './providers/Provider';
  import { Location } from './providers/Location';
  import { OpenMeteoProvider } from './providers/OpenMeteoProvider';

  import Dashboard from './components/Dashboard.svelte';
  import DetailsOverlay from './components/DetailsOverlay.svelte';
  import WeatherDetails from './components/WeatherDetails.svelte';
  import SettingsDetails from './components/SettingsDetails.svelte';
  import TeslaDetails from './components/TeslaDetails.svelte';
  import SolarDetails from './components/SolarDetails.svelte';
  import ClimateDetails from './components/ClimateDetails.svelte';
  import CameraDetails from './components/CameraDetails.svelte';
  import { Theme } from './Configuration';

  /* Capture PWA install prompt before browser dismisses it */
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    (window as any).__briefsky_deferred_prompt = e;
  });

  /* State */
  let provider: Provider;
  let location: Location | undefined;
  let weather: Weather | undefined = $state();
  let error: string | undefined = $state();
  let refreshTimeout: number | undefined;

  let activeDetails: string | null = $state(null);

  let inactivityTimeout: number | undefined;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    if (activeDetails) {
      inactivityTimeout = setTimeout(() => {
        closeAllDetails();
      }, 15000);
    }
  }

  function closeAllDetails() {
    activeDetails = null;
    clearTimeout(inactivityTimeout);
  }

  function openDetails(name: string) {
    activeDetails = name;
    resetInactivityTimer();
  }

  function applyTheme(theme: Theme) {
    const isDark =
      theme === Theme.Dark || (theme === Theme.System && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#1f2937');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f9fafb');
    }
  }

  $effect(() => {
    applyTheme($configuration.theme);
  });

  async function refresh() {
    clearTimeout(refreshTimeout);
    try {
      weather = await provider.fetch();
      error = undefined;
    } catch (err) {
      weather = undefined;
      error = err instanceof Error ? err.message : String(err);
    }
    refreshTimeout = setTimeout(refresh, $configuration.refreshInterval * 1000);
  }

  onMount(() => {
    // Listen for system theme changes
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onThemeChange = () => applyTheme($configuration.theme);
    darkMediaQuery.addEventListener('change', onThemeChange);

    // Inactivity listeners
    const activities = ['mousemove', 'mousedown', 'click', 'scroll', 'touchstart'];
    activities.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    const init = async () => {
      // Home Assistant Connection
      console.log('App: Initializing Home Assistant connection...');
      if ($configuration.haUrl && $configuration.haToken) {
        connect($configuration.haUrl, $configuration.haToken);
      } else {
        console.warn('App: HA URL or Token missing from config', { url: $configuration.haUrl, token: $configuration.haToken ? 'PRESENT' : 'MISSING' });
      }

      location = ($configuration.providerFactory.requiresLocation && ($configuration.location || (await Location.fromGeolocation()))) || undefined;
      provider = $configuration.providerFactory.fromParams($configuration.providerParams, location) || new OpenMeteoProvider(location || $configuration.location!);

      refresh();
    };

    init();

    return () => {
      darkMediaQuery.removeEventListener('change', onThemeChange);
      activities.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      clearTimeout(refreshTimeout);
    };
  });
</script>

<main class="text-gray-800 dark:text-gray-50 text-sm md:text-base min-h-screen bg-gray-50 dark:bg-gray-800 overflow-hidden font-sans">
  {#if !activeDetails}
    <Dashboard 
        {weather} 
        onWeatherClick={() => openDetails('weather')} 
        onSettingsClick={() => openDetails('settings')}
        onTeslaClick={() => openDetails('tesla')} 
        onSolarClick={() => openDetails('solar')}
        onClimateClick={() => openDetails('climate')}
        onCameraClick={() => openDetails('camera')}
    />
  {:else if activeDetails === 'weather'}
    <DetailsOverlay onClose={closeAllDetails}>
        <WeatherDetails {weather} {error} />
    </DetailsOverlay>
  {:else if activeDetails === 'tesla'}
    <DetailsOverlay onClose={closeAllDetails}>
        <TeslaDetails />
    </DetailsOverlay>
  {:else if activeDetails === 'solar'}
    <DetailsOverlay onClose={closeAllDetails}>
        <SolarDetails />
    </DetailsOverlay>
  {:else if activeDetails === 'climate'}
    <DetailsOverlay onClose={closeAllDetails}>
        <ClimateDetails />
    </DetailsOverlay>
  {:else if activeDetails === 'camera'}
    <DetailsOverlay onClose={closeAllDetails} compact>
        <CameraDetails />
    </DetailsOverlay>
  {:else if activeDetails === 'settings'}
    <DetailsOverlay onClose={closeAllDetails} center>
        <SettingsDetails onSave={closeAllDetails} />
    </DetailsOverlay>
  {/if}
</main>