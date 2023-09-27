import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'
import type { Fields } from '../../../../forms/Form/types'

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

export type SetUploadEdits = (uploadEdits?: UploadEdits) => void

export type Props = {
  collection: SanitizedCollectionConfig
  internalState?: Fields
  onChange?: (file?: File) => void
  setUploadEdits?: SetUploadEdits
  uploadEdits?: UploadEdits
}
