import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'

export type IndexProps = {
  collection: SanitizedCollectionConfig
  isEditing?: boolean
}
export type UploadEdits = {
  crop?: {
    height?: number
    width?: number
    x?: number
    y?: number
  }
  focalPoint?: {
    x?: number
    y?: number
  }
}
