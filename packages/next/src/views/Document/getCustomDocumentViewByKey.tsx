import type {
  DocumentViewComponent,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

export const getCustomDocumentViewByKey = (
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views'],
  customViewKey: string,
): DocumentViewComponent => {
  return typeof views?.edit?.[customViewKey] === 'object' &&
    'Component' in views.edit[customViewKey]
    ? views?.edit?.[customViewKey].Component
    : null
}
