import type { Permissions, User } from 'payload/auth'
import type {
  DocumentPermissions,
  DocumentPreferences,
  Payload,
  SanitizedConfig,
} from 'payload/types'
import { I18n } from '@payloadcms/translations'
import { EditViewProps } from 'payload/config'
import { FormState } from '../forms/Form/types'

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
  user: User
  id?: string
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  hasSavePermission?: boolean
  isEditing?: boolean
  docPermissions: DocumentPermissions
  action?: string
  apiURL: string
  canAccessAdmin?: boolean
  docPreferences: DocumentPreferences
  data: Document
  // isLoading: boolean
  updatedAt: string
  initialState?: FormState
}
