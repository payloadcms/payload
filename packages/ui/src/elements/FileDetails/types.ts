import type { SanitizedCollectionConfig } from 'payload/types'
import type { FileSizes } from '../../../../uploads/types'
import type { Data } from '../../forms/Form/types'

export type Props = {
  canEdit?: boolean
  collection: SanitizedCollectionConfig
  doc: Data & {
    sizes?: FileSizes
  }
  handleRemove?: () => void
  hasImageSizes?: boolean
  imageCacheTag?: string
}
