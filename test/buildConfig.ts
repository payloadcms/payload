import { Config, SanitizedConfig } from '../src/config/types';
import { buildConfig as buildPayloadConfig } from '../src/config/build';

export function buildConfig(config?: Partial<Config>): Promise<SanitizedConfig> {
  const [name] = process.argv.slice(2);
  const baseConfig: Config = {
    telemetry: false,
    ...config,
  };

  baseConfig.admin = {
    ...(baseConfig.admin || {}),
    webpack: (webpackConfig) => {
      const existingConfig = typeof config?.admin?.webpack === 'function'
        ? config.admin.webpack(webpackConfig)
        : webpackConfig;
      return {
        ...existingConfig,
        name,
        cache: process.env.NODE_ENV === 'test' ? {
          type: 'memory',
        } : existingConfig.cache,
      };
    },
  };

  if (process.env.PAYLOAD_DISABLE_ADMIN === 'true') {
    if (typeof baseConfig.admin !== 'object') baseConfig.admin = {};
    baseConfig.admin.disable = true;
  }

  return buildPayloadConfig(baseConfig);
}
