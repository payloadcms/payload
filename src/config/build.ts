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
    return sanitized.plugins.reduce((configWithPlugins, plugin) => plugin(configWithPlugins), sanitized);
  }

  return sanitized;
}
