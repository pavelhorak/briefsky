import { readable } from 'svelte/store';

import type { ProviderFactory } from './providers/Provider';
import type { GeocoderFactory } from './geocoders/Geocoder';
import { Location } from './providers/Location';
import { NominatimGeocoder } from './geocoders/NominatimGeocoder';
import { OpenMeteoProvider } from './providers/OpenMeteoProvider';
import { ProviderFactories } from './providers';

export enum StorageMode {
  QueryString,
  LocalStorage,
}

export enum AutoExpand {
  Today,
  All,
  None,
}

export enum Layout {
  Normal,
  Split,
}

export enum Theme {
  Light,
  Dark,
  System,
}

export interface Configuration {
  providerFactory: ProviderFactory;
  providerParams: { [key: string]: string };
  geocoderFactory: GeocoderFactory;
  location: Location | undefined;
  autoexpand: AutoExpand;
  title: string;
  refreshInterval: number;
  showHourlyPrecipitation: boolean;
  showHourlyWind: boolean;
  layout: Layout;
  haUrl: string;
  haToken: string;
  theme: Theme;
  ecowittAppKey: string;
  ecowittApiKey: string;
  ecowittMac: string;
  useEcowitt: boolean;
}

const DEFAULT_CONFIGURATION: Configuration = {
  providerFactory: OpenMeteoProvider,
  providerParams: {},
  geocoderFactory: NominatimGeocoder,
  location: new Location('49.116899542620146', '20.28857329071142'),
  autoexpand: AutoExpand.None,
  title: '',
  refreshInterval: 120,
  showHourlyPrecipitation: true,
  showHourlyWind: true,
  layout: Layout.Normal,
  haUrl: '',
  haToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2OGM5ZjEyNzY1YjA0YWM1ODA0ZmFiYmY3NzBlZGFlYyIsImlhdCI6MTc2OTkzNDE0MywiZXhwIjoyMDg1Mjk0MTQzfQ.NM821ovuu7YEl6L7uslsKOZpvuVwQOjo-Ltc_TShGBo',
  theme: Theme.System,
  ecowittAppKey: 'C6093EA2CB6C67AE3F362F7C9D457902',
  ecowittApiKey: 'da53865d-43ca-4d6c-b026-bf7206001bcb',
  ecowittMac: '80:64:6F:3E:F9:43',
  useEcowitt: true,
};

function decodeConfiguration(params: { [key: string]: string }): Configuration {
  const providerFactory = ProviderFactories.find((e) => e.id === params['provider']) || DEFAULT_CONFIGURATION.providerFactory;
  const providerParams = Object.fromEntries(providerFactory.fields.map((f: { name: string }) => [f.name, params[f.name]]));
  const geocoderFactory = DEFAULT_CONFIGURATION.geocoderFactory;
  const location = Location.fromString(params['location']) || DEFAULT_CONFIGURATION.location;
  const title = params['title'] || DEFAULT_CONFIGURATION.title;
  const autoexpand =
    params['autoexpand'] === 'today'
      ? AutoExpand.Today
      : params['autoexpand'] === 'all'
        ? AutoExpand.All
        : params['autoexpand'] === 'none'
          ? AutoExpand.None
          : DEFAULT_CONFIGURATION.autoexpand;
  const refreshInterval = parseInt(params['refresh_interval']) || DEFAULT_CONFIGURATION.refreshInterval;
  const showHourlyPrecipitation =
    params['hourly_precipitation'] === undefined ? DEFAULT_CONFIGURATION.showHourlyPrecipitation : params['hourly_precipitation'] === 'true' ? true : false;
  const showHourlyWind = params['hourly_wind'] === undefined ? DEFAULT_CONFIGURATION.showHourlyWind : params['hourly_wind'] === 'true' ? true : false;
  const layout = params['layout'] === 'split' ? Layout.Split : DEFAULT_CONFIGURATION.layout;
  const haUrl = params['ha_url'] || DEFAULT_CONFIGURATION.haUrl;
  const haToken = params['ha_token'] || DEFAULT_CONFIGURATION.haToken;
  const ecowittAppKey = params['ecowitt_app_key'] || DEFAULT_CONFIGURATION.ecowittAppKey;
  const ecowittApiKey = params['ecowitt_api_key'] || DEFAULT_CONFIGURATION.ecowittApiKey;
  const ecowittMac = params['ecowitt_mac'] || DEFAULT_CONFIGURATION.ecowittMac;
  const useEcowitt = params['use_ecowitt'] === undefined ? DEFAULT_CONFIGURATION.useEcowitt : params['use_ecowitt'] === 'true' ? true : false;
  const theme =
    params['theme'] === 'light'
      ? Theme.Light
      : params['theme'] === 'dark'
        ? Theme.Dark
        : params['theme'] === 'system'
          ? Theme.System
          : DEFAULT_CONFIGURATION.theme;

  return {
    providerFactory,
    providerParams,
    geocoderFactory,
    location,
    title,
    autoexpand,
    refreshInterval,
    showHourlyPrecipitation,
    showHourlyWind,
    layout,
    haUrl,
    haToken,
    theme,
    ecowittAppKey,
    ecowittApiKey,
    ecowittMac,
    useEcowitt,
  };
}

function encodeConfiguration(configuration: Configuration): object {
  const params: { [key: string]: string } = {};

  for (const field of configuration.providerFactory.fields) {
    if (configuration.providerParams[field.name] !== undefined) {
      params[field.name] = configuration.providerParams[field.name];
    }
  }
  if (configuration.location !== undefined && configuration.location !== DEFAULT_CONFIGURATION.location) {
    params['location'] = configuration.location.toString();
  }
  if (configuration.autoexpand !== DEFAULT_CONFIGURATION.autoexpand) {
    params['autoexpand'] = configuration.autoexpand === AutoExpand.Today ? 'today' : configuration.autoexpand === AutoExpand.All ? 'all' : 'none';
  }
  if (configuration.title !== DEFAULT_CONFIGURATION.title) {
    params['title'] = configuration.title;
  }
  if (configuration.refreshInterval !== DEFAULT_CONFIGURATION.refreshInterval) {
    params['refresh_interval'] = configuration.refreshInterval.toString();
  }
  if (configuration.showHourlyPrecipitation !== DEFAULT_CONFIGURATION.showHourlyPrecipitation) {
    params['hourly_precipitation'] = configuration.showHourlyPrecipitation.toString();
  }
  if (configuration.showHourlyWind !== DEFAULT_CONFIGURATION.showHourlyWind) {
    params['hourly_wind'] = configuration.showHourlyWind.toString();
  }
  if (configuration.layout !== DEFAULT_CONFIGURATION.layout) {
    params['layout'] = configuration.layout === Layout.Split ? 'split' : 'normal';
  }
  if (configuration.haUrl !== DEFAULT_CONFIGURATION.haUrl) {
    params['ha_url'] = configuration.haUrl;
  }
  if (configuration.haToken !== DEFAULT_CONFIGURATION.haToken) {
    params['ha_token'] = configuration.haToken;
  }
  if (configuration.theme !== DEFAULT_CONFIGURATION.theme) {
    params['theme'] = configuration.theme === Theme.Light ? 'light' : configuration.theme === Theme.Dark ? 'dark' : 'system';
  }
  if (configuration.ecowittAppKey !== DEFAULT_CONFIGURATION.ecowittAppKey) {
    params['ecowitt_app_key'] = configuration.ecowittAppKey;
  }
  if (configuration.ecowittApiKey !== DEFAULT_CONFIGURATION.ecowittApiKey) {
    params['ecowitt_api_key'] = configuration.ecowittApiKey;
  }
  if (configuration.ecowittMac !== DEFAULT_CONFIGURATION.ecowittMac) {
    params['ecowitt_mac'] = configuration.ecowittMac;
  }
  if (configuration.useEcowitt !== DEFAULT_CONFIGURATION.useEcowitt) {
    params['use_ecowitt'] = configuration.useEcowitt.toString();
  }

  return params;
}

export function getStorageMode(): StorageMode {
  return new URLSearchParams(window.location.search).get('storage') === 'local' ? StorageMode.LocalStorage : StorageMode.QueryString;
}

export function loadConfiguration(): Configuration {
  const storageMode = getStorageMode();

  let config: Configuration;
  if (storageMode === StorageMode.QueryString) {
    config = decodeConfiguration(Object.fromEntries(new URLSearchParams(window.location.search).entries()));
  } else {
    config = decodeConfiguration(JSON.parse(window.localStorage.getItem('configuration') || '{}'));
  }

  // Resolve haUrl: empty means "use current origin"
  if (!config.haUrl) {
    config.haUrl = window.location.origin;
  }

  return config;
}

export function storeConfiguration(configuration: Configuration): void {
  const storageMode = getStorageMode();

  if (storageMode === StorageMode.QueryString) {
    window.location.search = new URLSearchParams(encodeConfiguration(configuration) as Record<string, string>).toString();
  } else {
    window.localStorage.setItem('configuration', JSON.stringify(encodeConfiguration(configuration)));
    window.location.search = new URLSearchParams({ storage: 'local' }).toString();
  }
}

export const configuration = readable(DEFAULT_CONFIGURATION, function start(set) {
  set(loadConfiguration());
  return () => { };
});
