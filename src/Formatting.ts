/**
 * Global formatting rules for Briefsky
 */

/**
 * For temperature, show decimals only if absolute number of temperature value is less then 10, no decimals otherwise.
 */
export function formatTemperature(value: number | string | null | undefined): string {
  if (value == null) return '--';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '--';
  return Math.abs(numValue) < 10 ? numValue.toFixed(1) : numValue.toFixed(0);
}

/**
 * For wind speed, show decimals only if absolute number of value is less then 10, no decimals otherwise.
 * Value should be in m/s.
 */
export function formatWindSpeed(msValue: number | null | undefined): string {
  if (msValue == null || isNaN(msValue)) return '--';
  return Math.abs(msValue) < 10 ? msValue.toFixed(1) : msValue.toFixed(0);
}

/**
 * For percentage always no decimals.
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--';
  return value.toFixed(0);
}

/**
 * For energy, show decimals only if absolute number of value is more then 1000W and use kW unit,
 * no decimals otherwise and use W unit.
 */
export function formatEnergy(wValue: number | null | undefined): { value: string; unit: string } {
  if (wValue == null || isNaN(wValue)) return { value: '--', unit: 'W' };
  const absValue = Math.abs(wValue);
  if (absValue >= 1000) {
    return {
      value: (wValue / 1000).toFixed(1),
      unit: 'kW'
    };
  } else {
    return {
      value: wValue.toFixed(0),
      unit: 'W'
    };
  }
}
