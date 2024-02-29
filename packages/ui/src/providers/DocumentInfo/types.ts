import type { PaginatedDocs, TypeWithVersion } from 'payload/database'
import type {
  Data,
  DocumentPermissions,
  DocumentPreferences,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithID,
  TypeWithTimestamps,
} from 'payload/types'
import type React from 'react'

import type { FormState } from '../../forms/Form/types'

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
  docPreferences?: DocumentPreferences
  globalSlug?: SanitizedGlobalConfig['slug']
  hasSavePermission?: boolean
  id?: number | string
  initialData?: Data
  initialState?: FormState
  onSave?: (data: Data) => Promise<void> | void
}

export type DocumentInfo = DocumentInfoProps & {
  docConfig?: SanitizedCollectionConfig | SanitizedGlobalConfig
  preferencesKey?: string
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  slug?: string
  title?: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
}

export type DocumentInfoContext = Omit<DocumentInfo, 'docPreferences'> & {
  getDocPermissions: () => Promise<void>
  getDocPreferences: () => Promise<{ [key: string]: unknown }>
  getVersions: () => Promise<void>
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  setDocumentInfo?: (info: DocumentInfo) => void
  setDocumentTitle: (title: string) => void
}
