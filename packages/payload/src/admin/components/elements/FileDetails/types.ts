import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { FileSizes } from '../../../../uploads/types.js'
import type { Data } from '../../forms/Form/types.js'

export type Props = {
  collection: SanitizedCollectionConfig
  doc: Data & {
    sizes?: FileSizes
  }
  handleRemove?: () => void
}
