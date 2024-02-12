import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { EditViewConfig } from '../../../../../config/types'
import type { SanitizedGlobalConfig } from '../../../../../globals/config/types'

import { defaultGlobalViews } from '../../../views/Global/Routes/CustomComponent'
import { defaultCollectionViews } from '../../../views/collections/Edit/Routes/CustomComponent'

export const getCustomViews = (args: {
  collection: SanitizedCollectionConfig
  global: SanitizedGlobalConfig
}): EditViewConfig[] => {
  const { collection, global } = args

  let customViews: EditViewConfig[]

  if (collection) {
    const collectionViewsConfig =
      typeof collection?.admin?.components?.views?.Edit === 'object' &&
      typeof collection?.admin?.components?.views?.Edit !== 'function'
        ? collection?.admin?.components?.views?.Edit
        : undefined

    const defaultViewKeys = Object.keys(defaultCollectionViews())

    customViews = Object.entries(collectionViewsConfig || {}).reduce((prev, [key, view]) => {
      if (defaultViewKeys.includes(key)) {
        return prev
      }

      return [...prev, { ...view, key }]
    }, [])
  }

  if (global) {
    const globalViewsConfig =
      typeof global?.admin?.components?.views?.Edit === 'object' &&
      typeof global?.admin?.components?.views?.Edit !== 'function'
        ? global?.admin?.components?.views?.Edit
        : undefined

    const defaultViewKeys = Object.keys(defaultGlobalViews())

    customViews = Object.entries(globalViewsConfig || {}).reduce((prev, [key, view]) => {
      if (defaultViewKeys.includes(key)) {
        return prev
      }

      return [...prev, { ...view, key }]
    }, [])
  }

  return customViews
}
