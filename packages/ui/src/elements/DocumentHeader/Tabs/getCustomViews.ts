import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'
import type { EditViewConfig } from 'payload/config'
import { documentViewKeys } from './tabs'

export const getCustomViews = (args: {
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
}): EditViewConfig[] => {
  const { collectionConfig, globalConfig } = args

  let customViews: EditViewConfig[]

  if (collectionConfig) {
    const collectionViewsConfig =
      typeof collectionConfig?.admin?.components?.views?.Edit === 'object' &&
      typeof collectionConfig?.admin?.components?.views?.Edit !== 'function'
        ? collectionConfig?.admin?.components?.views?.Edit
        : undefined

    customViews = Object.entries(collectionViewsConfig || {}).reduce((prev, [key, view]) => {
      if (documentViewKeys.includes(key)) {
        return prev
      }

      return [...prev, { ...view, key }]
    }, [])
  }

  if (globalConfig) {
    const globalViewsConfig =
      typeof globalConfig?.admin?.components?.views?.Edit === 'object' &&
      typeof globalConfig?.admin?.components?.views?.Edit !== 'function'
        ? globalConfig?.admin?.components?.views?.Edit
        : undefined

    customViews = Object.entries(globalViewsConfig || {}).reduce((prev, [key, view]) => {
      if (documentViewKeys.includes(key)) {
        return prev
      }

      return [...prev, { ...view, key }]
    }, [])
  }

  return customViews
}
