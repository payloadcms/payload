import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'
import type { CollectionEditViewProps } from '../../views/types'

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  onSave?: CollectionEditViewProps['onSave']
  publishedDocUpdatedAt: string
}
