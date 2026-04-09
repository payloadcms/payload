import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  if (Array.isArray(config.plugins)) {
    let configAfterPlugins = config
    for (const plugin of config.plugins) {
      configAfterPlugins = await plugin(configAfterPlugins)
    }
    config = configAfterPlugins
  }

  // Pass 2: run afterPlugins callbacks for cross-plugin discovery.
  // Plugins can push callbacks to config.afterPlugins during pass 1 to defer
  // work that depends on the fully-assembled config from all plugins.
  if (Array.isArray(config.afterPlugins)) {
    for (const callback of config.afterPlugins) {
      config = await callback(config)
    }
  }

  return await sanitizeConfig(config)
}
