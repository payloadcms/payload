import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../../globals/config/types'

export type Props = {
  className?: string
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  originalDocID: string
  versionDate: string
  versionID: string
}
