import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
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
  onCreate?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
  }) => Promise<void> | void
  onDelete?: (args: {
    collectionConfig?: ClientCollectionConfig
    id: string
  }) => Promise<void> | void
  /* only available if `redirectAfterDuplicate` is `false` */
  onDuplicate?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
  }) => Promise<void> | void
  onLoadError?: (data?: any) => Promise<void> | void
  onSave?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
    result: Data
  }) => Promise<void> | void
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
}

export type DocumentInfoContext = {
  docConfig?: ClientCollectionConfig | ClientGlobalConfig
  getDocPermissions: (data?: Data) => Promise<void>
  getDocPreferences: () => Promise<DocumentPreferences>
  getVersions: () => Promise<void>
  initialData: Data
  initialState?: FormState
  isInitializing: boolean
  isLoading: boolean
  preferencesKey?: string
  publishedDoc?: { _status?: string } & TypeWithID & TypeWithTimestamps
  setDocFieldPreferences: (
    field: string,
    fieldPreferences: { [key: string]: unknown } & Partial<InsideFieldsPreferences>,
  ) => void
  setDocumentTitle: (title: string) => void
  slug?: string
  title: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
} & DocumentInfoProps
