import type { CollectionPermission, GlobalPermission, Permissions, User } from 'payload/auth'
import type {
  Document,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  PayloadT,
} from 'payload/types'
import type { Fields } from '../forms/Form/types'
import { FieldTypes } from '../exports'

export type CollectionEditViewProps = BaseEditViewProps & {
  collectionConfig?: SanitizedCollectionConfig
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  hasSavePermission?: boolean
  id: string
  isEditing?: boolean
  docPermissions: CollectionPermission | null
}

export type GlobalEditViewProps = BaseEditViewProps & {
  globalConfig: SanitizedGlobalConfig
  state?: Fields
  docPermissions: GlobalPermission | null
}

export type BaseEditViewProps = {
  config: SanitizedConfig
  action: string
  apiURL: string
  canAccessAdmin?: boolean
  data: Document
  // isLoading: boolean
  onSave: (json: any) => void
  updatedAt: string
  user: User | null | undefined
  fieldTypes: FieldTypes
  payload: PayloadT
  locale: string
  state?: Fields
  permissions: Permissions
  params: {
    segments: string[]
    collection?: string
    global?: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export type EditViewProps = CollectionEditViewProps | GlobalEditViewProps
