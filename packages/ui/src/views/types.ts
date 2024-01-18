import type { CollectionPermission, GlobalPermission, Permissions, User } from 'payload/auth'
import type {
  Document,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  Payload,
  DocumentPreferences,
} from 'payload/types'
import type { I18n } from '@payloadcms/translations'
import type { FormState } from '../forms/Form/types'
import type { FieldTypes, Locale } from 'payload/config'

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
      docPermissions: GlobalPermission | null
    }
) & {
  config: SanitizedConfig
  action: (formData: FormData) => Promise<void>
  apiURL: string
  canAccessAdmin?: boolean
  data: Document
  docPreferences: DocumentPreferences
  // isLoading: boolean
  onSave: (json: any) => void
  updatedAt: string
  user: User | null | undefined
  fieldTypes: FieldTypes
  payload: Payload
  locale: Locale
  formState?: FormState
  permissions: Permissions
  params?: {
    segments?: string[]
    collection?: string
    global?: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
  i18n: I18n
}
