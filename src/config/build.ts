import { Config, SanitizedConfig } from './types';
import sanitize from './sanitize';

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export function buildConfig(config: Config): SanitizedConfig {
  const sanitized = sanitize(config);

  if (Array.isArray(config.plugins)) {
    const configWithPlugins = sanitized.plugins.reduce((updatedConfig, plugin) => plugin(updatedConfig), sanitized);
    return sanitize(configWithPlugins);
  }

  return sanitized;
}
