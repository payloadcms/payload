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
    return await sanitizeConfig(configAfterPlugins)
  }

  return await sanitizeConfig(config)
}
