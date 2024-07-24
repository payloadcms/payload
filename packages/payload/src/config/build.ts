import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  if (Array.isArray(config.plugins)) {
    const configAfterPlugins = await config.plugins.reduce(async (acc, plugin) => {
      const configAfterPlugin = await acc
      return plugin(configAfterPlugin)
    }, Promise.resolve(config))

    return await sanitizeConfig(configAfterPlugins)
  }

  return await sanitizeConfig(config)
}
