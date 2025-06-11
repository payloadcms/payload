import type { EditViewComponent, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

export const getCustomViewByKey = (
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views'],
  customViewKey: string,
): EditViewComponent => {
  return typeof views?.edit?.[customViewKey] === 'object' &&
    'Component' in views.edit[customViewKey]
    ? views?.edit?.[customViewKey].Component
    : null
}
