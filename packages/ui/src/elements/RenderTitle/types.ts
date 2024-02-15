import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  className?: string
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
  element?: React.ElementType
  fallback?: string
  title?: string
  isDate?: boolean
  dateFormat?: any // TODO: type this
  // dateFormat?: SanitizedCollectionConfig['fields'][0]['admin']['date']['displayFormat']
}
