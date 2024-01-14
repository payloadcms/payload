import type { SanitizedCollectionConfig } from 'payload/types'
import type { Fields } from '../../..'

export type Props = {
  collection: SanitizedCollectionConfig
  internalState?: Fields
  onChange?: (file?: File) => void
  updatedAt?: string
}
