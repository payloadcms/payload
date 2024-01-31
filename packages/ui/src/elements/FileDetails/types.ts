import type { SanitizedCollectionConfig, Data, FileSizes } from 'payload/types'

export type Props = {
  canEdit?: boolean
  uploadConfig: SanitizedCollectionConfig['upload']
  doc: Data & {
    sizes?: FileSizes
  }
  collectionSlug: string
  handleRemove?: () => void
  hasImageSizes?: boolean
  imageCacheTag?: string
}
