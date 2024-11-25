import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(
  _config: (() => Config) | Config,
): Promise<(() => Promise<SanitizedConfig>) | SanitizedConfig> {
  let configFn: (() => Config) | null = null

  if (typeof _config !== 'function') {
    console.warn(
      'For optimal performance, buildConfig should be called with a function that returns a config object. Otherwise, you will notice increased memory usage and decreased performance during development.',
    )
    configFn = () => _config
    // We could still return a function that returns the sanitized config here,
    // so that it's cached properly and not loaded multiple times after every page transition.
    // However, in order for this to be backwards compatible, we return the sanitized config directly, the old way.
    // Otherwise, the imported config would suddenly be a function when imported, which may break standalone scripts
    return await loadAndSanitizeConfig(configFn)
  } else {
    configFn = _config
  }

  if (process.env.NODE_ENV === 'production') {
    return await loadAndSanitizeConfig(configFn)
  } else {
    return async () => {
      return await loadAndSanitizeConfig(configFn)
    }
  }
}

const loadAndSanitizeConfig = async (configFn: () => Config): Promise<SanitizedConfig> => {
  const config = configFn()
  if (Array.isArray(config.plugins)) {
    const configAfterPlugins = await config.plugins.reduce(async (acc, plugin) => {
      const configAfterPlugin = await acc
      return plugin(configAfterPlugin)
    }, Promise.resolve(config))

    return await sanitizeConfig(configAfterPlugins)
  }

  return await sanitizeConfig(config)
}
