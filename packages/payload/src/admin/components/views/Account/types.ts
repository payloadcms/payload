import type { CollectionPermission } from '../../../../auth/types'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Data, Fields } from '../../forms/Form/types'

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
