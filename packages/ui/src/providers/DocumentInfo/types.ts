import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  ClientUser,
  Data,
  DocumentPermissions,
  DocumentPreferences,
  FormState,
  InsideFieldsPreferences,
  PaginatedDocs,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithID,
  TypeWithTimestamps,
  TypeWithVersion,
} from 'payload'
import type React from 'react'

export type DocumentInfoProps = {
  AfterDocument?: React.ReactNode
  AfterFields?: React.ReactNode
  BeforeDocument?: React.ReactNode
  BeforeFields?: React.ReactNode
  action?: string
  apiURL?: string
  collectionSlug?: SanitizedCollectionConfig['slug']
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  docPermissions?: DocumentPermissions
  globalSlug?: SanitizedGlobalConfig['slug']
  hasPublishPermission?: boolean
  hasSavePermission?: boolean
  id: null | number | string
  initialData?: Data
  initialState?: FormState
  isEditing?: boolean
  onLoadError?: (data?: any) => Promise<void> | void
  onSave?: (data: Data) => Promise<void> | void
}

export type DocumentInfoContext = {
  checkLockStatus: () => void
  docConfig?: ClientCollectionConfig | ClientGlobalConfig
  getDocPermissions: (data?: Data) => Promise<void>
  getDocPreferences: () => Promise<DocumentPreferences>
  getVersions: () => Promise<void>
  initialData: Data
  initialEditor: ClientUser
  initialState?: FormState
  isDocumentLocked: boolean
  isInitializing: boolean
  isLoading: boolean
  lastEditedAt: Date
  lockDocument: (docId: number | string, user: ClientUser) => Promise<void>
  preferencesKey?: string
  publishedDoc?: { _status?: string } & TypeWithID & TypeWithTimestamps
  setDocFieldPreferences: (
    field: string,
    fieldPreferences: { [key: string]: unknown } & Partial<InsideFieldsPreferences>,
  ) => void
  setDocumentTitle: (title: string) => void
  shouldCheckLockStatus?: boolean
  slug?: string
  title: string
  unlockDocument: (docId: number | string) => Promise<void>
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  updateDocumentEditor: (docId: number | string, user: ClientUser) => Promise<void>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
} & DocumentInfoProps
