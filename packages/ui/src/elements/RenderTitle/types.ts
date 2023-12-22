import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  className?: string
  collection?: SanitizedCollectionConfig
  data?: {
    id?: string
  }
  element?: React.ElementType
  fallback?: string
  global?: SanitizedGlobalConfig
  title?: string
  useAsTitle?: string
}
