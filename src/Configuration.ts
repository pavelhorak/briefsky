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

export interface EntityIds {
  // Energy
  solarPower: string;
  loadPower: string;
  gridPower: string;
  backupMeter: string;
  pvPower: string;
  pv1Power: string;
  pv2Power: string;
  batterySoc: string;
  batteryPower: string;
  batteryState: string;
  batteryTemp: string;
  batterySoh: string;
  batteryCapacity: string;
  todaySolarProduction: string;
  todayBatteryCharge: string;
  todayBatteryDischarge: string;
  todayGridImport: string;
  todayGridExport: string;
  totalGridImport: string;
  totalGridExport: string;
  todayLoad: string;
  loadL1Power: string;
  loadL2Power: string;
  loadL3Power: string;
  // Tesla
  teslaCharging: string;
  teslaChargingCable: string;
  teslaBattery: string;
  teslaInteriorTemp: string;
  teslaOutsideTemp: string;
  teslaRange: string;
  teslaChargeLimit: string;
  teslaChargeCurrent: string;
  teslaChargeVoltage: string;
  teslaChargePower: string;
  teslaAddedEnergy: string;
  teslaTimeToFull: string;
  teslaClimate: string;
  teslaDefrost: string;
  teslaSentryMode: string;
  teslaLock: string;
  teslaChargePortLock: string;
  teslaChargePort: string;
  teslaTrunk: string;
  teslaFrunk: string;
  teslaWindows: string;
  // Climate (HVAC)
  hvacClimate: string;
  hvacActive: string;
  fireplaceSwitch: string;
  scheduleSetpoint: string;
  scheduleNextSetpoint: string;
  scheduleNextSetpointTime: string;
  dhwTemp: string;
  dhwActive: string;
  dhwStatus: string;
  waterPressure: string;
  // Camera
  camera: string;
  // Switches
  garageLight: string;
  outdoorLight: string;
  garageDoor: string;
  gateOpen: string;
  gateClose: string;
}

export const DEFAULT_ENTITY_IDS: EntityIds = {
  solarPower: 'sensor.inverter_power',
  loadPower: 'sensor.inverter_load_power',
  gridPower: 'sensor.inverter_external_power',
  backupMeter: 'sensor.vue_123_1min',
  pvPower: 'sensor.inverter_pv_power',
  pv1Power: 'sensor.inverter_pv1_power',
  pv2Power: 'sensor.inverter_pv2_power',
  batterySoc: 'sensor.inverter_battery',
  batteryPower: 'sensor.inverter_battery_power',
  batteryState: 'sensor.inverter_battery_state',
  batteryTemp: 'sensor.inverter_battery_temperature',
  batterySoh: 'sensor.inverter_battery_soh',
  batteryCapacity: 'sensor.inverter_battery_capacity',
  todaySolarProduction: 'sensor.inverter_today_production',
  todayBatteryCharge: 'sensor.inverter_today_battery_charge',
  todayBatteryDischarge: 'sensor.inverter_today_battery_discharge',
  todayGridImport: 'sensor.inverter_today_energy_import',
  todayGridExport: 'sensor.inverter_today_energy_export',
  totalGridImport: 'sensor.inverter_total_energy_import',
  totalGridExport: 'sensor.inverter_total_energy_export',
  todayLoad: 'sensor.inverter_today_load_consumption',
  loadL1Power: 'sensor.inverter_load_l1_power',
  loadL2Power: 'sensor.inverter_load_l2_power',
  loadL3Power: 'sensor.inverter_load_l3_power',
  teslaCharging: 'sensor.juniper_nabija_sa',
  teslaChargingCable: 'binary_sensor.juniper_nabijaci_kabel',
  teslaBattery: 'sensor.juniper_uroven_baterie',
  teslaInteriorTemp: 'sensor.juniper_vnutorna_teplota',
  teslaOutsideTemp: 'sensor.juniper_vonkajsia_teplota',
  teslaRange: 'sensor.juniper_rozsah_baterie',
  teslaChargeLimit: 'number.juniper_limit_nabijania',
  teslaChargeCurrent: 'sensor.juniper_nabijaci_prud',
  teslaChargeVoltage: 'sensor.juniper_napatie_nabijacky',
  teslaChargePower: 'sensor.juniper_vykon_nabijacky',
  teslaAddedEnergy: 'sensor.juniper_pridana_energia_nabijania',
  teslaTimeToFull: 'sensor.juniper_cas_do_uplneho_nabitia',
  teslaClimate: 'climate.juniper_klimatizacia',
  teslaDefrost: 'switch.juniper_odmrazovanie',
  teslaSentryMode: 'switch.juniper_rezim_strazenia',
  teslaLock: 'lock.juniper_zamok',
  teslaChargePortLock: 'lock.juniper_zamok_nabijacieho_kabla',
  teslaChargePort: 'cover.juniper_dvierka_nabijacieho_portu',
  teslaTrunk: 'cover.juniper_kufor',
  teslaFrunk: 'cover.juniper_kufor_2',
  teslaWindows: 'cover.juniper_windows',
  hvacClimate: 'climate.circa',
  hvacActive: 'binary_sensor.circa_status',
  fireplaceSwitch: 'switch.circa_fireplace_mode',
  scheduleSetpoint: 'sensor.circa_current_schedule_setpoint',
  scheduleNextSetpoint: 'sensor.circa_next_setpoint',
  scheduleNextSetpointTime: 'sensor.circa_next_setpoint_time',
  dhwTemp: 'sensor.dhw_water_temperature',
  dhwActive: 'binary_sensor.dhw_status',
  dhwStatus: 'sensor.dhw_status',
  waterPressure: 'sensor.home_water_pressure',
  camera: 'camera.camera_media_profile1',
  garageLight: 'switch.sonoff_1001e97b61',
  outdoorLight: 'switch.sonoff_outdoor_lights',
  garageDoor: 'switch.garage_door',
  gateOpen: 'switch.sonoff_10024889f6_1',
  gateClose: 'switch.sonoff_1002487ede_1',
};

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
  dadName: string;
  dadCallUrl: string;
  momName: string;
  momCallUrl: string;
  /* Virtual battery seed: balance (kWh) stated on the utility statement, valid as of the seed date (local midnight).
     Current balance = seed balance + grid export - grid import accumulated since that date. */
  vbSeedDate: string;
  vbSeedBalance: number;
  entityIds: EntityIds;
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
  dadName: 'Dad',
  dadCallUrl: 'https://meet.google.com/vxf-ispq-reo',
  momName: 'Mom',
  momCallUrl: '',
  vbSeedDate: '2026-07-01',
  vbSeedBalance: 308.972,
  entityIds: DEFAULT_ENTITY_IDS,
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
  const dadName = params['dad_name'] || DEFAULT_CONFIGURATION.dadName;
  const dadCallUrl = params['dad_call_url'] || DEFAULT_CONFIGURATION.dadCallUrl;
  const momName = params['mom_name'] || DEFAULT_CONFIGURATION.momName;
  const momCallUrl = params['mom_call_url'] || DEFAULT_CONFIGURATION.momCallUrl;
  const vbSeedDate = params['vb_seed_date'] || DEFAULT_CONFIGURATION.vbSeedDate;
  const vbSeedBalance = Number.isFinite(parseFloat(params['vb_seed_balance'])) ? parseFloat(params['vb_seed_balance']) : DEFAULT_CONFIGURATION.vbSeedBalance;
  let entityIds: EntityIds = DEFAULT_ENTITY_IDS;
  if (params['entity_ids']) {
    try {
      entityIds = { ...DEFAULT_ENTITY_IDS, ...JSON.parse(params['entity_ids']) };
    } catch {
      entityIds = DEFAULT_ENTITY_IDS;
    }
  }
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
    dadName,
    dadCallUrl,
    momName,
    momCallUrl,
    vbSeedDate,
    vbSeedBalance,
    entityIds,
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
  if (configuration.dadName !== DEFAULT_CONFIGURATION.dadName) {
    params['dad_name'] = configuration.dadName;
  }
  if (configuration.dadCallUrl !== DEFAULT_CONFIGURATION.dadCallUrl) {
    params['dad_call_url'] = configuration.dadCallUrl;
  }
  if (configuration.momName !== DEFAULT_CONFIGURATION.momName) {
    params['mom_name'] = configuration.momName;
  }
  if (configuration.momCallUrl !== DEFAULT_CONFIGURATION.momCallUrl) {
    params['mom_call_url'] = configuration.momCallUrl;
  }
  if (configuration.vbSeedDate !== DEFAULT_CONFIGURATION.vbSeedDate) {
    params['vb_seed_date'] = configuration.vbSeedDate;
  }
  if (configuration.vbSeedBalance !== DEFAULT_CONFIGURATION.vbSeedBalance) {
    params['vb_seed_balance'] = configuration.vbSeedBalance.toString();
  }
  const overriddenIds: Partial<EntityIds> = {};
  for (const k of Object.keys(DEFAULT_ENTITY_IDS) as (keyof EntityIds)[]) {
    if (configuration.entityIds[k] !== DEFAULT_ENTITY_IDS[k]) {
      overriddenIds[k] = configuration.entityIds[k];
    }
  }
  if (Object.keys(overriddenIds).length > 0) {
    params['entity_ids'] = JSON.stringify(overriddenIds);
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
