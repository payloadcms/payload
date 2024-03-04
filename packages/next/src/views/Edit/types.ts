import type { FormState } from '@payloadcms/ui'
import type { EditViewProps } from 'payload/config'
import type { Data, DocumentPermissions, DocumentPreferences } from 'payload/types'

import type { InitPageResult } from '../../utilities/initPage'

export type ServerSideEditViewProps = EditViewProps & {
  action?: string
  apiURL: string
  canAccessAdmin?: boolean
  data: Data
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  docPermissions: DocumentPermissions
  docPreferences: DocumentPreferences
  hasSavePermission?: boolean
  id?: string
  initPageResult: InitPageResult
  initialState?: FormState
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
  searchParams: { [key: string]: string | string[] | undefined }
  // isLoading: boolean
  updatedAt: string
}
