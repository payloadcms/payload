import type { CollectionPermission } from '../../../../auth/types.js'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { Data, Fields } from '../../forms/Form/types.js'

export type Props = {
  action: string
  apiURL: string
  collection: SanitizedCollectionConfig
  data: Data
  hasSavePermission: boolean
  initialState: Fields
  isLoading: boolean
  onSave?: () => void
  permissions: CollectionPermission
}
