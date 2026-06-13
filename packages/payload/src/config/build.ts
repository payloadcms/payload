import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config or async function that returns a Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(
  configArg: (() => Config | Promise<Config>) | Config,
): Promise<SanitizedConfig> {
  const config = typeof configArg === 'function' ? await configArg() : configArg

  if (Array.isArray(config.plugins)) {
    const sorted = [...config.plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    for (const plugin of sorted) {
      config = await plugin(config)
    }
  }

  if (Array.isArray(config.storage)) {
    for (const adapter of config.storage) {
      if (typeof adapter?.init !== 'function') {
        throw new Error(
          `storage contains an invalid entry: expected an object with an \`init\` function. ` +
            `Ensure you are passing the result of a storage adapter factory (e.g. s3Storage({…})) ` +
            `to \`storage\`, not to \`plugins\`.`,
        )
      }
      config = await adapter.init(config)
    }
  }

  return await sanitizeConfig(config)
}
