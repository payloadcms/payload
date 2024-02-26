import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload/types'

export type Props = {
  canEdit?: boolean
  collectionSlug: string
  doc: Data & {
    sizes?: FileSizes
  }
  handleRemove?: () => void
  hasImageSizes?: boolean
  imageCacheTag?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}
