import type { CollectionPermission, GlobalPermission, User } from 'payload/auth'
import type {
  Document,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import type { I18n } from '@payloadcms/translations'
import type { Fields } from '../forms/Form/types'

export type CollectionEditViewProps = BaseEditViewProps & {
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  hasSavePermission?: boolean
  id: string
  state?: Fields
  isEditing?: boolean
  permissions: CollectionPermission | null
  data: Document
  user: User
  i18n: I18n
}

export type GlobalEditViewProps = BaseEditViewProps & {
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
  state?: Fields
  permissions: GlobalPermission | null
  i18n: I18n
}

export type BaseEditViewProps = {
  action: string
  apiURL: string
  canAccessAdmin?: boolean
  data: Document
  // isLoading: boolean
  onSave: (json: any) => void
  updatedAt: string
  user: User | null | undefined
}

export type EditViewProps = CollectionEditViewProps | GlobalEditViewProps
