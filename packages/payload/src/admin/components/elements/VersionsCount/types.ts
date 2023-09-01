import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
}
