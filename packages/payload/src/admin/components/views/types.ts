import { CollectionPermission, GlobalPermission, User } from '../../../auth'
import { Fields, SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../exports/types'

export type EditViewProps = (
  | {
      id: string
      collection: SanitizedCollectionConfig
      hasSavePermission: boolean
      isEditing: boolean
      internalState: Fields
      initialState?: Fields
      permissions: CollectionPermission
      disableActions: boolean
      disableLeaveWithoutSaving: boolean
    }
  | {
      global: SanitizedGlobalConfig
      initialState: Fields
      permissions: GlobalPermission
    }
) & {
  isLoading: boolean
  onSave: (json: any) => void
  updatedAt: string
  data: any
  user: User
  canAccessAdmin: boolean
  action: string
  apiURL: string
}
