import merge from 'deepmerge';
import { Config, SanitizedConfig } from '../src/config/types';
import { buildConfig as buildPayloadConfig } from '../src/config/build';

const baseConfig: Config = {
  typescript: {
    outputFile: process.env.PAYLOAD_TS_OUTPUT_PATH,
  },
  telemetry: false,
};

export function buildConfig(overrides?: Partial<Config>): SanitizedConfig {
  if (process.env.NODE_ENV === 'test') {
    baseConfig.admin = {
      ...(baseConfig.admin || {}),
      webpack: (config) => {
        const existingConfig = typeof overrides?.admin?.webpack === 'function'
          ? overrides.admin.webpack(config)
          : config;
        return {
          ...existingConfig,
          cache: {
            type: 'memory',
          },
        };
      },
    };
  }

  if (process.env.PAYLOAD_DISABLE_ADMIN === 'true') {
    if (typeof baseConfig.admin !== 'object') baseConfig.admin = {};
    baseConfig.admin.disable = true;
  }

  return buildPayloadConfig(merge(baseConfig, overrides || {}));
}
