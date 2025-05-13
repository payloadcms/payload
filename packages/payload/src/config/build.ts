import { createDraft, finishDraft, isDraft, setAutoFreeze } from 'immer'

import type { Config, SanitizedConfig } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export async function buildConfig(config: Config): Promise<SanitizedConfig> {
  if (Array.isArray(config.plugins)) {
    // Not freezing objects is faster
    setAutoFreeze(false)

    // Use Immer to ensure config modifications by plugins are immutable and do not affect the original config / shared references
    let mutableConfig: Config = createDraft(config) as Config

    for (const plugin of config.plugins) {
      const newConfig = await plugin(mutableConfig)
      if (isDraft(newConfig)) {
        mutableConfig = newConfig
      } else {
        // If the plugin returns a new config object that is no longer a draft, we need to merge it into the mutable config
        for (const key of Object.keys(newConfig)) {
          mutableConfig[key as any] = newConfig[key as any]
        }
      }
    }

    const configAfterPlugins = finishDraft(mutableConfig)

    return await sanitizeConfig(configAfterPlugins)
  }

  return await sanitizeConfig(config)
}
