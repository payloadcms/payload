/* eslint-disable no-use-before-define */
/* eslint-disable no-nested-ternary */
import type { Config, SanitizedConfig } from './types'

import { sanitizeConfig } from './sanitize'

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

    const sanitizedConfig = sanitizeConfig(configAfterPlugins)

    return sanitizedConfig
  }

  return sanitizeConfig(config)
}
