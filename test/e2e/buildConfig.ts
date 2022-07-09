import merge from 'deepmerge';
import { buildConfig as buildPayloadConfig } from '../../src/config/build';
import type { Config, SanitizedConfig } from '../../src/config/types';

export function buildConfig(overrides?: Partial<Config>): SanitizedConfig {
  const baseConfig: Config = {};
  if (process.env.NODE_ENV === 'test') {
    baseConfig.admin = {
      webpack: (config) => ({
        ...config,
        cache: {
          type: 'memory',
        },
      }),
    };
  }
  return buildPayloadConfig(merge(baseConfig, overrides || {}));
}
