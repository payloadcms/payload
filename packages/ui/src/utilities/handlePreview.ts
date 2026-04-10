import {
  type CollectionConfig,
  extractJWT,
  type GlobalConfig,
  type Operation,
  type PayloadRequest,
  type SanitizedConfig,
} from 'payload'

/**
 * Multi-level check to determine whether live preview is enabled on a collection or global.
 * For example, live preview can be enabled at both the root config level, or on the entity's config.
 * If a collectionConfig/globalConfig is provided, checks if it is enabled at the root level,
 * or on the entity's own config.
 */
export const isPreviewEnabled = ({
  collectionConfig,
  globalConfig,
}: {
  collectionConfig?: CollectionConfig
  globalConfig?: GlobalConfig
}): boolean => {
  if (globalConfig) {
    return Boolean(globalConfig.admin?.preview)
  }

  if (collectionConfig) {
    return Boolean(collectionConfig.admin?.preview)
  }
}

/**
 * 1. Looks up the relevant live preview config, which could have been enabled:
 *   a. At the root level, e.g. `collections: ['posts']`
 *   b. On the collection or global config, e.g. `admin: { livePreview: { ... } }`
 * 2. Determines if live preview is enabled, and if not, early returns.
 * 3. Merges the config with the root config, if necessary.
 * 4. Executes the `url` function, if necessary.
 *
 * Notice: internal function only. Subject to change at any time. Use at your own risk.
 */
export const handlePreview = async ({
  collectionSlug,
  config,
  data,
  globalSlug,
  operation,
  req,
}: {
  collectionSlug?: string
  config: SanitizedConfig
  data: Record<string, unknown>
  globalSlug?: string
  operation?: Operation
  req: PayloadRequest
}): Promise<{
  isPreviewEnabled?: boolean
  previewURL?: string
}> => {
  const collectionConfig = collectionSlug
    ? req.payload.collections[collectionSlug]?.config
    : undefined

  const globalConfig = globalSlug ? config.globals.find((g) => g.slug === globalSlug) : undefined

  const enabled = isPreviewEnabled({
    collectionConfig,
    globalConfig,
  })

  if (!enabled) {
    return {}
  }

  const generatePreviewURL = collectionConfig?.admin?.preview || globalConfig?.admin?.preview
  const token = extractJWT(req)
  let previewURL: string | undefined

  if (typeof generatePreviewURL === 'function' && operation !== 'create') {
    try {
      const result = await generatePreviewURL(data, { locale: req.locale, req, token })

      if (typeof result === 'string') {
        previewURL = result
      }
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `There was an error executing the live preview URL function for ${collectionSlug || globalSlug}`,
      })
    }
  }

  return { isPreviewEnabled: enabled, previewURL }
}
