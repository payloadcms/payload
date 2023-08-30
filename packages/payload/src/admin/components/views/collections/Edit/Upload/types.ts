import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js'
import type { Fields } from '../../../../forms/Form/types.js'

export type Props = {
  adminThumbnail?: string
  collection: SanitizedCollectionConfig
  data?: Fields
  internalState?: Fields
  mimeTypes?: string[]
}
