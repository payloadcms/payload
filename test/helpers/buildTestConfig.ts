import merge from 'deepmerge';
import { buildConfig } from '../../src/config/build';
import { Config, SanitizedConfig } from '../../src/config/types';

export function buildTestConfig(overrides?: Partial<Config>): SanitizedConfig {
  const baseConfig: Config = {};
  return buildConfig(merge(baseConfig, overrides || {}));
}
