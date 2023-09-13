import type { SanitizedCollectionConfig } from '../../../../collections/config/types'

export type Props = {
  className?: string
  collection?: SanitizedCollectionConfig
  data?: {
    id?: string
  }
  element?: React.ElementType
  fallback?: string
  title?: string
  useAsTitle?: string
}
