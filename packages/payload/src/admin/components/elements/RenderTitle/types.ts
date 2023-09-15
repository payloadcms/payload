import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../exports/types'

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
