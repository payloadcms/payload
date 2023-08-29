import type { SanitizedCollectionConfig } from '../../../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../../../globals/config/types.js'

export type Props = {
  className?: string
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  originalDocID: string
  versionDate: string
  versionID: string
}
