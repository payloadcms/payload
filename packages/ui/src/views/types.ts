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
import { FieldMap } from '../forms/RenderFields/buildFieldMaps/types'

export type EditViewProps = (
  | {
      collectionSlug?: string
      disableActions?: boolean
      disableLeaveWithoutSaving?: boolean
      hasSavePermission?: boolean
      id: number | string
      isEditing?: boolean
      docPermissions: CollectionPermission | null
    }
  | {
      globalSlug?: string
      docPermissions: GlobalPermission | null
    }
) & {
  action?: string
  apiURL: string
  canAccessAdmin?: boolean
  data: Document
  docPreferences: DocumentPreferences
  // isLoading: boolean
  updatedAt: string
  user: User | null | undefined
  locale: Locale
  formState?: FormState
  permissions: Permissions
  params?: {
    segments?: string[]
    collection?: string
    global?: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
  fieldMap: FieldMap
}
