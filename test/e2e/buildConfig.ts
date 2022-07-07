import merge from 'deepmerge';
import { buildConfig as buildPayloadConfig } from '../../src/config/build';
import { Config, SanitizedConfig } from '../../src/config/types';

export function buildConfig(overrides?: Partial<Config>): SanitizedConfig {
  const baseConfig: Config = {};
  return buildPayloadConfig(merge(baseConfig, overrides || {}));
}
