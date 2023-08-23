import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  className?: string
  collection?: SanitizedCollectionConfig
  doc?: Record<string, unknown>
  onClick?: () => void
  onKeyDown?: () => void
  thumbnail?: React.ReactNode
  label?: string
  alignLabel?: 'left' | 'center'
}
