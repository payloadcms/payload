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
  action?: string
  AfterDocument?: React.ReactNode
  AfterFields?: React.ReactNode
  apiURL?: string
  BeforeDocument?: React.ReactNode
  BeforeFields?: React.ReactNode
  collectionSlug?: SanitizedCollectionConfig['slug']
  disableActions?: boolean
  disableCreate?: boolean
  disableLeaveWithoutSaving?: boolean
  docPermissions?: DocumentPermissions
  globalSlug?: SanitizedGlobalConfig['slug']
  hasPublishPermission?: boolean
  hasSavePermission?: boolean
  id: null | number | string
  initialData?: Data | null
  initialState?: FormState
  isEditing?: boolean
  onDelete?: (args: {
    collectionConfig?: ClientCollectionConfig
    id: string
  }) => Promise<void> | void
  onDrawerCreate?: () => void
  /* only available if `redirectAfterDuplicate` is `false` */
  onDuplicate?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
  }) => Promise<void> | void
  onLoadError?: (data?: any) => Promise<void> | void
  onSave?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
    operation: 'create' | 'update'
    result: Data
  }) => Promise<void> | void
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
}

export type DocumentInfoContext = {
  currentEditor?: ClientUser
  docConfig?: ClientCollectionConfig | ClientGlobalConfig
  documentIsLocked?: boolean
  getDocPermissions: (data?: Data) => Promise<void>
  getDocPreferences: () => Promise<DocumentPreferences>
  getVersions: () => Promise<void>
  initialData: Data
  initialState?: FormState
  isInitializing: boolean
  isLoading: boolean
  preferencesKey?: string
  publishedDoc?: { _status?: string } & TypeWithID & TypeWithTimestamps
  setCurrentEditor?: React.Dispatch<React.SetStateAction<ClientUser>>
  setDocFieldPreferences: (
    field: string,
    fieldPreferences: { [key: string]: unknown } & Partial<InsideFieldsPreferences>,
  ) => void
  setDocumentIsLocked?: React.Dispatch<React.SetStateAction<boolean>>
  setDocumentTitle: (title: string) => void
  title: string
  unlockDocument: (docId: number | string, slug: string) => Promise<void>
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  updateDocumentEditor: (docId: number | string, slug: string, user: ClientUser) => Promise<void>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
} & DocumentInfoProps
