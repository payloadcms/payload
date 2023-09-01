import type { SanitizedCollectionConfig } from '../../../../collections/config/types'

export type Props = {
  className?: string
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  size?: 'expand' | 'large' | 'medium' | 'small'
}
