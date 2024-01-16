import type { SanitizedCollectionConfig } from 'payload/types'
import type { FormState } from '../../..'

export type Props = {
  collection: SanitizedCollectionConfig
  internalState?: FormState
  onChange?: (file?: File) => void
  updatedAt?: string
}
