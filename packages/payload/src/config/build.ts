import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  const _log = (m: string) => console.log(`[buildConfig] ${m}`)

  _log('start')

  if (Array.isArray(config.plugins)) {
    let configAfterPlugins = config

    for (const plugin of config.plugins) {
      configAfterPlugins = await plugin(configAfterPlugins)
      _log(`plugin "${(plugin as { name?: string }).name || 'anonymous'}" done`)
    }

    const result = await sanitizeConfig(configAfterPlugins)
    _log('sanitizeConfig done')
    return result
  }

  const result = await sanitizeConfig(config)
  _log('sanitizeConfig done')
  return result
}
