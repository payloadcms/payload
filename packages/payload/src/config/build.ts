import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  if (Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      config = await plugin(config)
    }
  }

  if (Array.isArray(config.afterPlugins)) {
    for (const afterPlugin of config.afterPlugins) {
      config = await afterPlugin(config)
    }
  }

  return await sanitizeConfig(config)
}
