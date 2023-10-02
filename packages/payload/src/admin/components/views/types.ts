import type { CollectionPermission, GlobalPermission, User } from '../../../auth'
import type {
  Fields,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from '../../../exports/types'

export type EditViewProps = (
  | {
      collection: SanitizedCollectionConfig
      disableActions?: boolean
      disableLeaveWithoutSaving?: boolean
      hasSavePermission: boolean
      id: string
      initialState?: Fields
      internalState: Fields
      isEditing: boolean
      permissions: CollectionPermission
    }
  | {
      global: SanitizedGlobalConfig
      initialState: Fields
      permissions: GlobalPermission
    }
) & {
  action: string
  apiURL: string
  canAccessAdmin: boolean
  data: any
  isLoading: boolean
  onSave: (json: any) => void
  updatedAt: string
  user: User
}
