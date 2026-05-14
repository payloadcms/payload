import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  if (Array.isArray(config.storageAdapters)) {
    for (const adapter of config.storageAdapters) {
      if (typeof adapter?.init !== 'function') {
        throw new Error(
          `storageAdapters contains an invalid entry: expected an object with an \`init\` function. ` +
            `Ensure you are passing the result of a storage adapter factory (e.g. s3Storage({…})) ` +
            `to \`storageAdapters\`, not to \`plugins\`.`,
        )
      }
      config = await adapter.init(config)
    }
  }

  if (Array.isArray(config.plugins)) {
    const sorted = [...config.plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    for (const plugin of sorted) {
      config = await plugin(config)
    }
  }

  return await sanitizeConfig(config)
}
