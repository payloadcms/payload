import type { PayloadRequest, SanitizedConfig } from 'payload'

import type { SanitizedSearchPluginConfig } from '../types.js'

export type GetLocalesToSyncArgs = {
  collection: string
  config: SanitizedConfig
  doc?: any
  pluginConfig: SanitizedSearchPluginConfig
  req: PayloadRequest
}

export const getLocalesToSync = async ({
  collection,
  config,
  doc,
  pluginConfig,
  req,
}: GetLocalesToSyncArgs): Promise<string[]> => {
  if (!config.localization) {
    return []
  }

  const allLocaleCodes = config.localization.localeCodes

  if (typeof pluginConfig.filterLocalesToSync === 'function') {
    try {
      const filteredLocaleCodes = await pluginConfig.filterLocalesToSync({
        collectionSlug: collection,
        doc,
        localeCodes: allLocaleCodes,
        req,
      })
      return filteredLocaleCodes
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: 'Search plugin: Error executing filterLocalesToSync. Falling back to all locales.',
      })
    }
  }

  return allLocaleCodes
}
