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
    let configAfterPlugins = config
    for (const plugin of config.plugins) {
      configAfterPlugins = await plugin(configAfterPlugins)
    }
    return await sanitizeConfig(configAfterPlugins)
  }

  return await sanitizeConfig(config)
}
