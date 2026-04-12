import type { ProviderFactory } from './Provider';

/* Providers */
import { OpenMeteoProvider } from './OpenMeteoProvider';

export const ProviderFactories: ProviderFactory[] = [
  OpenMeteoProvider,
];
