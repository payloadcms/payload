import type { EditViewConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

export const getViewConfig = (args: {
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  name: string
}): EditViewConfig => {
  const { name, collectionConfig, globalConfig } = args

  if (collectionConfig) {
    const collectionConfigViewsConfig =
      typeof collectionConfig?.admin?.components?.views?.edit === 'object' &&
      typeof collectionConfig?.admin?.components?.views?.edit !== 'function'
        ? collectionConfig?.admin?.components?.views?.edit
        : undefined

    return collectionConfigViewsConfig?.[name]
  }

  if (globalConfig) {
    const globalConfigViewsConfig =
      typeof globalConfig?.admin?.components?.views?.edit === 'object' &&
      typeof globalConfig?.admin?.components?.views?.edit !== 'function'
        ? globalConfig?.admin?.components?.views?.edit
        : undefined

    return globalConfigViewsConfig?.[name]
  }

  return null
}
