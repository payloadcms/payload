import type { CollectionConfig, GlobalConfig, SanitizedConfig } from 'payload'

export const getLivePreviewConfig = ({
  collectionConfig,
  config,
  globalConfig,
  isLivePreviewEnabled,
}: {
  collectionConfig?: CollectionConfig
  config: SanitizedConfig
  globalConfig?: GlobalConfig
  isLivePreviewEnabled: boolean
}) => ({
  ...(isLivePreviewEnabled ? config.admin.livePreview : {}),
  ...(collectionConfig?.admin?.livePreview || {}),
  ...(globalConfig?.admin?.livePreview || {}),
})
