import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  className?: string
  element?: React.ElementType
  fallback?: string
  title?: string
  isDate?: boolean
  dateFormat?: any // TODO: type this
  // dateFormat?: SanitizedCollectionConfig['fields'][0]['admin']['date']['displayFormat']
}
