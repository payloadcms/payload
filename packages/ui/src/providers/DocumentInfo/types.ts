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
  readonly AfterDocument?: React.ReactNode
  readonly AfterFields?: React.ReactNode
  readonly BeforeDocument?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly action?: string
  readonly apiURL?: string
  readonly collectionSlug?: SanitizedCollectionConfig['slug']
  readonly disableActions?: boolean
  readonly disableLeaveWithoutSaving?: boolean
  readonly docPermissions?: DocumentPermissions
  readonly globalSlug?: SanitizedGlobalConfig['slug']
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  readonly id: null | number | string
  readonly initialData?: Data
  readonly initialState?: FormState
  readonly isEditing?: boolean
  readonly onLoadError?: (data?: any) => Promise<void> | void
  readonly onSave?: (data: Data) => Promise<void> | void
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
