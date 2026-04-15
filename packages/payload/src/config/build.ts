import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  if (Array.isArray(config.plugins)) {
    const sorted = [...config.plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    for (const plugin of sorted) {
      config = await plugin(config)
    }
  }

  return await sanitizeConfig(config)
}
