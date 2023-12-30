import type { CollectionPermission, GlobalPermission, User } from 'payload/auth'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import type { Fields } from '../forms/Form/types'

export type CollectionEditViewProps = BaseEditViewProps & {
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  hasSavePermission?: boolean
  id: string
  initialState?: Fields
  isEditing?: boolean
  permissions: CollectionPermission | null
}

export type GlobalEditViewProps = BaseEditViewProps & {
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
  initialState?: Fields
  permissions: GlobalPermission | null
}

export type BaseEditViewProps = {
  action: string
  apiURL: string
  canAccessAdmin?: boolean
  data: any
  // isLoading: boolean
  onSave: (json: any) => void
  updatedAt: string
  user: User | null | undefined
}

export type EditViewProps = CollectionEditViewProps | GlobalEditViewProps
