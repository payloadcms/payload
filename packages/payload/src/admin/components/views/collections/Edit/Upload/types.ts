import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'
import type { Fields } from '../../../../forms/Form/types'

export type Props = {
  collection: SanitizedCollectionConfig
  internalState?: Fields
  onChange?: (file?: File) => void
  updatedAt?: string
}
