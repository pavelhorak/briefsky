import type { Provider, CurrentWeather, DailyWeather, Weather, IndoorTemperatures } from './Provider';
import type { Location } from './Location';
import { ConditionsIcon, PrecipitationType } from './Provider';
import { loadConfiguration } from '../Configuration';

const CONDITIONS_TEXT_MAP: { [key: string]: string } = {
  '0': 'Clear Sky',
  '1': 'Mainly Clear',
  '2': 'Partly Cloudy',
  '3': 'Overcast',
  '45': 'Fog',
  '48': 'Freezing Fog',
  '51': 'Light Drizzle',
  '53': 'Moderate Drizzle',
  '55': 'Dense Drizzle',
  '56': 'Light Freezing Drizzle',
  '57': 'Dense Freezing Drizzle',
  '61': 'Slight Rain',
  '63': 'Moderate Rain',
  '65': 'Heavy Rain',
  '66': 'Light Freezing Rain',
  '67': 'Heavy Freezing Rain',
  '71': 'Slight Snow',
  '73': 'Moderate Snow',
  '75': 'Heavy Snow',
  '77': 'Snow Grains',
  '80': 'Slight Rain Showers',
  '81': 'Moderate Rain Showers',
  '82': 'Violent Rain Showers',
  '85': 'Slight Snow Showers',
  '86': 'Heavy Snow Showers',
  '95': 'Thunderstorm',
  '96': 'Thunderstorm with Slight Hail',
  '99': 'Thunderstorm with Heavy Hail',
};

const CONDITIONS_ICON_MAP: { [key: string]: ConditionsIcon } = {
  '0': ConditionsIcon.Clear,
  '1': ConditionsIcon.Clear,
  '2': ConditionsIcon.PartlyCloudy,
  '3': ConditionsIcon.Overcast,
  '45': ConditionsIcon.Fog,
  '48': ConditionsIcon.Fog,
  '51': ConditionsIcon.LightRain,
  '53': ConditionsIcon.LightRain,
  '55': ConditionsIcon.LightRain,
  '56': ConditionsIcon.LightSleet,
  '57': ConditionsIcon.LightSleet,
  '61': ConditionsIcon.LightRain,
  '63': ConditionsIcon.Rain,
  '65': ConditionsIcon.Rain,
  '66': ConditionsIcon.LightSleet,
  '67': ConditionsIcon.Sleet,
  '71': ConditionsIcon.LightSnow,
  '73': ConditionsIcon.Snow,
  '75': ConditionsIcon.Snow,
  '77': ConditionsIcon.LightSnow,
  '80': ConditionsIcon.LightRain,
  '81': ConditionsIcon.Rain,
  '82': ConditionsIcon.Rain,
  '85': ConditionsIcon.LightSnow,
  '86': ConditionsIcon.Snow,
  '95': ConditionsIcon.Thunderstorm,
  '96': ConditionsIcon.Thunderstorm,
  '99': ConditionsIcon.Thunderstorm,
};

export class OpenMeteoProvider implements Provider {
  static id = 'openmeteo';
  static description = 'Open-Meteo';
  static attribution = 'https://open-meteo.com';
  static requiresLocation = true;
  static fields = [];

  static ENDPOINT_URL = 'https://api.open-meteo.com/v1/forecast';
  static CACHE_TTL_MS = 20 * 60 * 1000;
  static DAILY_FIELDS = ['weathercode', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset', 'precipitation_probability_max', 'precipitation_sum'];
  static HOURLY_FIELDS = [
    'temperature_2m',
    'relativehumidity_2m',
    'dewpoint_2m',
    'apparent_temperature',
    'weathercode',
    'pressure_msl',
    'visibility',
    'windspeed_10m',
    'winddirection_10m',
    'precipitation_probability',
    'precipitation',
    'snowfall',
    'rain',
    'showers',
  ];

  location: Location;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private cachedOpenMeteoData: any = null;
  private cachedOpenMeteoAt = 0;

  constructor(location: Location) {
    this.location = location;
  }

  async fetch(): Promise<Weather> {
    const currentTimestamp = Date.now();
    const startDate = new Date(currentTimestamp - 86400 * 1000).toISOString().split('T')[0];
    const endDate = new Date(currentTimestamp + 8 * 86400 * 1000).toISOString().split('T')[0];

    const config = loadConfiguration();

    const openMeteoCacheValid = this.cachedOpenMeteoData && currentTimestamp - this.cachedOpenMeteoAt < OpenMeteoProvider.CACHE_TTL_MS;

    const openMeteoPromise = openMeteoCacheValid
      ? null
      : fetch(
          OpenMeteoProvider.ENDPOINT_URL +
            '?' +
            new URLSearchParams(
              [
                ['latitude', this.location.latitude],
                ['longitude', this.location.longitude],
                ['timezone', 'auto'],
                ['timeformat', 'unixtime'],
                ['start_date', startDate],
                ['end_date', endDate],
                ['current_weather', 'true'],
              ]
                .concat(OpenMeteoProvider.DAILY_FIELDS.map((f) => ['daily', f]))
                .concat(OpenMeteoProvider.HOURLY_FIELDS.map((f) => ['hourly', f])),
            ),
        );

    let ecowittPromise: Promise<Response | null> = Promise.resolve(null);
    if (config.useEcowitt && config.ecowittApiKey && config.ecowittAppKey && config.ecowittMac) {
      const ecowittUrl = `https://api.ecowitt.net/api/v3/device/real_time?application_key=${config.ecowittAppKey}&api_key=${config.ecowittApiKey}&mac=${config.ecowittMac}&call_back=all&temp_unitid=1&pressure_unitid=3&wind_speed_unitid=6&rainfall_unitid=12&solar_irradiance_unitid=14`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      ecowittPromise = fetch(ecowittUrl, { signal: controller.signal })
        .catch((e) => {
          console.warn('Ecowitt fetch skipped', e);
          return null;
        })
        .finally(() => clearTimeout(timeoutId));
    }

    let openMeteoResponse: Response | null = null;
    let ecowittResponse: Response | null = null;

    try {
      [openMeteoResponse, ecowittResponse] = await Promise.all([openMeteoPromise, ecowittPromise]);
    } catch (e) {
      throw new Error(`Fetching weather data: ${e.toString()}`);
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let data: any;
    if (openMeteoResponse) {
      try {
        data = await openMeteoResponse.json();
      } catch (e) {
        throw new Error(`Fetching from Open-Meteo: Unexpected response data: ${e.toString()}`);
      }
      if (!openMeteoResponse.ok) {
        throw new Error(`Fetching from Open-Meteo: ${data.reason}`);
      }
      this.cachedOpenMeteoData = data;
      this.cachedOpenMeteoAt = currentTimestamp;
    } else {
      data = this.cachedOpenMeteoData;
    }

    let ecowittData: any = null;
    if (ecowittResponse && ecowittResponse.ok) {
      try {
        ecowittData = await ecowittResponse.json();
      } catch (e) {
        console.error('Failed to parse Ecowitt data', e);
      }
    }

    const dailyData = Array.from(Array(data.daily.time.length).keys()).map((i) =>
      Object.fromEntries(Object.keys(data.daily).map((k) => [k, data.daily[k][i]])),
    );
    const hourlyData = Array.from(Array(data.hourly.time.length).keys()).map((i) =>
      Object.fromEntries(Object.keys(data.hourly).map((k) => [k, data.hourly[k][i]])),
    );

    const currentDailyIndex = data.current_weather.time < data.daily.time[1] ? 0 : 1;
    const currentHourlyIndex = data.hourly.time
      .map((t: any, i: number) => [Math.abs(t - data.current_weather.time), i])
      .sort((a: [number, number], b: [number, number]) => a[0] - b[0])[0][1];

    const current: CurrentWeather = {
      timestamp: new Date(data.current_weather.time * 1000),
      conditions: CONDITIONS_TEXT_MAP[data.current_weather.weathercode] ?? 'Unknown',
      conditions_icon: CONDITIONS_ICON_MAP[data.current_weather.weathercode] ?? ConditionsIcon.Unknown,
      temperature: (config.useEcowitt && ecowittData?.data?.outdoor?.temperature?.value !== undefined) ? parseFloat(ecowittData.data.outdoor.temperature.value) : data.current_weather.temperature,
      temperature_low: data.daily.temperature_2m_min[currentDailyIndex],
      temperature_high: data.daily.temperature_2m_max[currentDailyIndex],
      feels_like_temperature: (config.useEcowitt && ecowittData?.data?.outdoor?.app_temp?.value !== undefined) ? parseFloat(ecowittData.data.outdoor.app_temp.value) : data.hourly.apparent_temperature[currentHourlyIndex],
      dew_point_temperature: (config.useEcowitt && ecowittData?.data?.outdoor?.dew_point?.value !== undefined) ? parseFloat(ecowittData.data.outdoor.dew_point.value) : data.hourly.dewpoint_2m[currentHourlyIndex],
      relative_humidity: (config.useEcowitt && ecowittData?.data?.outdoor?.humidity?.value !== undefined) ? parseInt(ecowittData.data.outdoor.humidity.value) : data.hourly.relativehumidity_2m[currentHourlyIndex],
      wind_speed: (config.useEcowitt && ecowittData?.data?.wind?.wind_speed?.value !== undefined) ? parseFloat(ecowittData.data.wind.wind_speed.value) * 3.6 : data.current_weather.windspeed,
      wind_direction: (config.useEcowitt && ecowittData?.data?.wind?.wind_direction?.value !== undefined) ? parseInt(ecowittData.data.wind.wind_direction.value) : data.current_weather.winddirection,
      pressure: (config.useEcowitt && ecowittData?.data?.pressure?.relative?.value !== undefined) ? parseFloat(ecowittData.data.pressure.relative.value) : data.hourly.pressure_msl[currentHourlyIndex],
      visibility: data.hourly.visibility[currentHourlyIndex] / 1000,
      uv_index: (config.useEcowitt && ecowittData?.data?.solar_and_uvi?.uvi?.value !== undefined) ? parseInt(ecowittData.data.solar_and_uvi.uvi.value) : undefined,
      hourly: hourlyData
        .filter((h: any) => h.time >= data.current_weather.time && h.time < data.current_weather.time + 90000)
        .map((h: any) => ({
          timestamp: new Date(h.time * 1000),
          conditions: CONDITIONS_TEXT_MAP[h.weathercode] ?? 'Unknown',
          conditions_icon: CONDITIONS_ICON_MAP[h.weathercode] ?? ConditionsIcon.Unknown,
          temperature: h.temperature_2m,
          wind_speed: h.windspeed_10m,
          wind_direction: h.winddirection_10m,
          precipitation_probability: h.precipitation_probability,
          precipitation_amount: h.precipitation,
          precipitation_type:
            h.precipitation === 0 ? PrecipitationType.None : h.snowfall > h.rain + h.showers ? PrecipitationType.Snow : PrecipitationType.Rain,
        })),
    };

    const daily: DailyWeather[] = dailyData
      .filter((d: any) => data.current_weather.time - d.time < 20 * 3600)
      .map((d: any) => ({
        timestamp: new Date(d.time * 1000),
        conditions: CONDITIONS_TEXT_MAP[d.weathercode] ?? 'Unknown',
        conditions_icon: CONDITIONS_ICON_MAP[d.weathercode] ?? ConditionsIcon.Unknown,
        temperature_low: d.temperature_2m_min,
        temperature_high: d.temperature_2m_max,
        sunrise_timestamp: new Date(d.sunrise * 1000),
        sunset_timestamp: new Date(d.sunset * 1000),
        precipitation_probability: d.precipitation_probability_max,
        precipitation_amount: d.precipitation_sum,
        hourly: hourlyData
          .filter((h: any) => h.time >= d.time && h.time < d.time + 86400)
          .map((h: any) => ({
            timestamp: new Date(h.time * 1000),
            conditions: CONDITIONS_TEXT_MAP[h.weathercode] ?? 'Unknown',
            conditions_icon: CONDITIONS_ICON_MAP[h.weathercode] ?? ConditionsIcon.Unknown,
            temperature: h.temperature_2m,
            wind_speed: h.windspeed_10m,
            wind_direction: h.winddirection_10m,
            precipitation_probability: h.precipitation_probability,
            precipitation_amount: h.precipitation,
            precipitation_type:
              h.precipitation === 0 ? PrecipitationType.None : h.snowfall > h.rain + h.showers ? PrecipitationType.Snow : PrecipitationType.Rain,
          })),
      }));

    let indoor_temperatures: IndoorTemperatures | undefined;
    if (config.useEcowitt && ecowittData?.data) {
      const livingRoom = parseFloat(ecowittData.data.temp_and_humidity_ch1?.temperature?.value);
      const garage = parseFloat(ecowittData.data.temp_and_humidity_ch2?.temperature?.value);
      const roof = parseFloat(ecowittData.data.indoor?.temperature?.value);
      indoor_temperatures = {
        living_room: Number.isFinite(livingRoom) ? livingRoom : undefined,
        garage: Number.isFinite(garage) ? garage : undefined,
        roof: Number.isFinite(roof) ? roof : undefined,
      };
    }

    return {
      current,
      daily,
      indoor_temperatures,
    };
  }

  static fromParams(_: { [key: string]: string }, location?: Location): Provider | null {
    if (location === undefined) return null;
    return new OpenMeteoProvider(location);
  }
}