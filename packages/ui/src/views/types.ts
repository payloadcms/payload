import type { CollectionPermission, GlobalPermission, Permissions, User } from 'payload/auth'
import type { Document, DocumentPreferences, Payload, SanitizedConfig } from 'payload/types'
import type { FormState } from '../forms/Form/types'
import type { Locale } from 'payload/config'
import { I18n } from '@payloadcms/translations'

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
  onSave?: (json: any) => void
  updatedAt: string
  user: User | null | undefined
  locale: Locale
  formState?: FormState
  initializeFormState?: boolean
  BeforeDocument?: React.ReactNode
  AfterDocument?: React.ReactNode
  AfterFields?: React.ReactNode
}

export type ServerSideEditViewProps = EditViewProps & {
  payload: Payload
  config: SanitizedConfig
  searchParams: { [key: string]: string | string[] | undefined }
  i18n: I18n
  collectionConfig?: SanitizedConfig['collections'][0]
  globalConfig?: SanitizedConfig['globals'][0]
  params: {
    segments: string[]
    collection?: string
    global?: string
  }
  permissions: Permissions
}
