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
  readonly action?: string
  readonly AfterDocument?: React.ReactNode
  readonly AfterFields?: React.ReactNode
  readonly apiURL?: string
  readonly BeforeFields?: React.ReactNode
  readonly collectionSlug?: SanitizedCollectionConfig['slug']
  readonly disableActions?: boolean
  readonly disableCreate?: boolean
  readonly disableLeaveWithoutSaving?: boolean
  readonly docPermissions?: DocumentPermissions
  readonly globalSlug?: SanitizedGlobalConfig['slug']
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  readonly id?: number | string
  readonly initialData?: Data
  readonly initialState?: FormState
  readonly isEditing?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
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
