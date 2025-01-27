import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { EditViewConfig } from '../../../../../config/types'
import type { SanitizedGlobalConfig } from '../../../../../globals/config/types'

export const getViewConfig = (args: {
  collection: SanitizedCollectionConfig
  global: SanitizedGlobalConfig
  name: string
}): EditViewConfig => {
  const { name, collection, global } = args

  if (collection) {
    const collectionViewsConfig =
      typeof collection?.admin?.components?.views?.Edit === 'object' &&
      typeof collection?.admin?.components?.views?.Edit !== 'function'
        ? collection?.admin?.components?.views?.Edit
        : undefined

    return collectionViewsConfig?.[name]
  }

  if (global) {
    const globalViewsConfig =
      typeof global?.admin?.components?.views?.Edit === 'object' &&
      typeof global?.admin?.components?.views?.Edit !== 'function'
        ? global?.admin?.components?.views?.Edit
        : undefined

    return globalViewsConfig?.[name]
  }

  return null
}
