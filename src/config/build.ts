import { Config, SanitizedConfig } from './types';
import sanitize from './sanitize';

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export function buildConfig(config: Config): SanitizedConfig {
  if (Array.isArray(config.plugins)) {
    const configWithPlugins = config.plugins.reduce((updatedConfig, plugin) => plugin(updatedConfig), config);
    return sanitize(configWithPlugins);
  }

  return sanitize(config);
}
