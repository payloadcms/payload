import type { CollectionConfig, GlobalConfig, SanitizedConfig } from 'payload'

/**
 * Multi-level check to determine whether live preview is enabled on a collection or global.
 * For example, live preview can be enabled at both the root config level, or on the entity's config.
 * If a collectionConfig/globalConfig is provided, checks if it is enabled at the root level,
 * or on the entity's own config.
 */
export const isLivePreviewEnabled = ({
  collectionConfig,
  config,
  globalConfig,
}: {
  collectionConfig?: CollectionConfig
  config: SanitizedConfig
  globalConfig?: GlobalConfig
}): boolean => {
  if (globalConfig) {
    return Boolean(
      config.admin?.livePreview?.globals?.includes(globalConfig.slug) ||
        globalConfig.admin?.livePreview,
    )
  }

  if (collectionConfig) {
    return Boolean(
      config.admin?.livePreview?.collections?.includes(collectionConfig.slug) ||
        collectionConfig.admin?.livePreview,
    )
  }
}
