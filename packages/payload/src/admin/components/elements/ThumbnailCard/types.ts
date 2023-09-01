import type { SanitizedCollectionConfig } from '../../../../collections/config/types'

export type Props = {
  alignLabel?: 'center' | 'left'
  className?: string
  collection?: SanitizedCollectionConfig
  doc?: Record<string, unknown>
  label?: string
  onClick?: () => void
  onKeyDown?: () => void
  thumbnail?: React.ReactNode
}
