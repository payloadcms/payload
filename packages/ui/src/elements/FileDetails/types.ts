import type { SanitizedCollectionConfig, Data, FileSizes } from 'payload/types'

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
