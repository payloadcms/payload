import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  className?: string
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
  data?: {
    id?: string
  }
  element?: React.ElementType
  fallback?: string
  title?: string
}
