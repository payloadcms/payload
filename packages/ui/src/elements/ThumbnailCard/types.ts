import type { SanitizedCollectionConfig, TypeWithID } from 'payload/types'

export type Props = {
  alignLabel?: 'center' | 'left'
  className?: string
  collection?: SanitizedCollectionConfig
  doc?: TypeWithID & { filename?: string }
  label?: string
  onClick?: () => void
  onKeyDown?: () => void
  thumbnail?: React.ReactNode
}
