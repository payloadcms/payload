import type { CollectionPermission, GlobalPermission, Permissions, User } from 'payload/auth'
import type {
  Document,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  Payload,
} from 'payload/types'
import type { I18n } from '@payloadcms/translations'
import type { Fields } from '../forms/Form/types'
import { FieldTypes } from '../exports'

export type EditViewProps = (
  | {
      collectionConfig: SanitizedCollectionConfig
      disableActions?: boolean
      disableLeaveWithoutSaving?: boolean
      hasSavePermission?: boolean
      id: string
      isEditing?: boolean
      docPermissions: CollectionPermission | null
    }
  | {
      globalConfig: SanitizedGlobalConfig
      state?: Fields
      docPermissions: GlobalPermission | null
    }
) & {
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
  payload: Payload
  locale: string
  state?: Fields
  permissions: Permissions
  params: {
    segments: string[]
    collection?: string
    global?: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
  i18n: I18n
}
