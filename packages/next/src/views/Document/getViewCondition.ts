import type {
  Data,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

export const getViewCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  doc: Data
  globalConfig: SanitizedGlobalConfig
  name: string
  req: PayloadRequest
}): boolean => {
  const { name, collectionConfig, doc, globalConfig, req } = args

  let viewConfig

  if (collectionConfig) {
    if (typeof collectionConfig?.admin?.components?.views?.edit === 'object') {
      viewConfig = collectionConfig.admin.components.views.edit[name]
    }
  } else if (globalConfig) {
    if (typeof globalConfig?.admin?.components?.views?.edit === 'object') {
      viewConfig = globalConfig.admin.components.views.edit[name]
    }
  }

  const { condition } = viewConfig || {}

  const meetsCondition = !condition || (condition && Boolean(condition({ doc, req })))

  return meetsCondition
}
