import type { EditViewComponent } from 'payload/bundle'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/bundle'

import { isReactComponentOrFunction } from 'payload/bundle'

export const getCustomViewByKey = (
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views'],
  customViewKey: string,
): EditViewComponent => {
  return typeof views?.Edit === 'function'
    ? views?.Edit
    : typeof views?.Edit === 'object' &&
        views?.Edit?.[customViewKey] &&
        typeof views?.Edit?.[customViewKey] === 'function'
      ? views?.Edit?.[customViewKey]
      : views?.Edit?.[customViewKey]
        ? typeof views?.Edit?.[customViewKey] === 'object' &&
          'Component' in views.Edit[customViewKey] &&
          isReactComponentOrFunction(views?.Edit?.[customViewKey].Component) &&
          views?.Edit?.[customViewKey].Component
        : null
}
