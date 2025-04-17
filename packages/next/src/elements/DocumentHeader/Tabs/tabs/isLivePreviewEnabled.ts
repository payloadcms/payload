import type { CollectionConfig, Config, GlobalConfig, SanitizedConfig } from 'payload'

export function isLivePreviewEnabled({
  collectionConfig,
  config,
  globalConfig,
}: {
  collectionConfig?: CollectionConfig
  config?: Config | SanitizedConfig
  globalConfig?: GlobalConfig
}): boolean {
  let isLivePreview = false

  if (collectionConfig) {
    isLivePreview = Boolean(
      config?.admin?.livePreview?.collections?.includes(collectionConfig.slug) ||
        collectionConfig?.admin?.livePreview,
    )
  }

  if (globalConfig) {
    isLivePreview = Boolean(
      config?.admin?.livePreview?.globals?.includes(globalConfig.slug) ||
        globalConfig?.admin?.livePreview,
    )
  }

  return Boolean(config?.admin?.livePreview?.defaultTab && isLivePreview)
}
