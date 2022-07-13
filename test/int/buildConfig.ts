import merge from 'deepmerge';
import { buildConfig as buildPayloadConfig } from '../../src/config/build';
import type { Config, SanitizedConfig } from '../../src/config/types';

export function buildConfig(overrides?: Partial<Config>): SanitizedConfig {
  const baseConfig: Config = {};

  if (process.env.NODE_ENV === 'test') {
    baseConfig.admin = {
      disable: true,
    };
  }

  return buildPayloadConfig(merge(baseConfig, overrides || {}));
}
