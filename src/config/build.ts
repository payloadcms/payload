/* eslint-disable no-use-before-define */
/* eslint-disable no-nested-ternary */
import { Config, SanitizedConfig } from './types';
import sanitize from './sanitize';

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export function buildConfig(config: Config): SanitizedConfig {
  if (Array.isArray(config.plugins)) {
    const configWithPlugins = config.plugins.reduce(
      (updatedConfig, plugin) => plugin(updatedConfig),
      config,
    );

    const sanitizedConfig = sanitize(configWithPlugins);

    return sanitizedConfig;
  }

  return sanitize(config);
}
