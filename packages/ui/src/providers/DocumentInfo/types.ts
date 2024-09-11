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
  readonly action?: string
  readonly AfterDocument?: React.ReactNode
  readonly AfterFields?: React.ReactNode
  readonly apiURL?: string
  readonly BeforeDocument?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly collectionSlug?: SanitizedCollectionConfig['slug']
  readonly disableActions?: boolean
  readonly disableCreate?: boolean
  readonly disableLeaveWithoutSaving?: boolean
  readonly docPermissions?: DocumentPermissions
  readonly globalSlug?: SanitizedGlobalConfig['slug']
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  readonly id: null | number | string
  readonly initialData?: Data
  readonly initialState?: FormState
  readonly isEditing?: boolean
  readonly onDelete?: (args: {
    collectionConfig?: ClientCollectionConfig
    id: string
  }) => Promise<void> | void
  readonly onDrawerCreate?: () => void
  /* only available if `redirectAfterDuplicate` is `false` */
  readonly onDuplicate?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
  }) => Promise<void> | void
  readonly onLoadError?: (data?: any) => Promise<void> | void
  readonly onSave?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
    operation: 'create' | 'update'
    result: Data
  }) => Promise<void> | void
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
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
