import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'
import type { Fields } from '../../../../forms/Form/types'

export type Props = {
  collection: SanitizedCollectionConfig
  internalState?: Fields
  setFocalPoint?: (focalPoint: { x: number; y: number }) => void
  onChange?: (file?: File) => void
}
