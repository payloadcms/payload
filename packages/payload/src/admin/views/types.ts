import type { DocumentPermissions, Permissions, User } from '../../auth'
import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { DocumentPreferences } from '../../preferences/types'
import type { PayloadRequest } from '../../types'
import type { Data, FormState } from '../types'

export type AdminViewConfig = {
  Component: AdminViewComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  path: string
  sensitive?: boolean
  strict?: boolean
}

export type AdminViewProps = {
  canAccessAdmin?: boolean
  user: User | null | undefined
}

export type AdminViewComponent = React.ComponentType<AdminViewProps>

export type AdminView = AdminViewComponent | AdminViewConfig

export type EditViewProps = {
  collectionSlug?: string
  globalSlug?: string
}

export type InitPageResult = {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  locale: Locale
  permissions: Permissions
  req: PayloadRequest
}

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
