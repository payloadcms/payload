import type { EditViewComponent, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

export const getCustomViewByKey = (
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views'],
  customViewKey: string,
): EditViewComponent => {
  return typeof views?.Edit?.[customViewKey] === 'object' &&
    'Component' in views.Edit[customViewKey]
    ? views?.Edit?.[customViewKey].Component
    : null
}
