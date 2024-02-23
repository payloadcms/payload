import type React from 'react'

import type {
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithTimestamps,
  TypeWithID,
  DocumentPermissions,
  DocumentPreferences,
  Data,
} from 'payload/types'

import { PaginatedDocs, TypeWithVersion } from 'payload/database'
import { FormState } from '../../forms/Form/types'

export type DocumentInfoProps = {
  AfterDocument?: React.ReactNode
  AfterFields?: React.ReactNode
  BeforeDocument?: React.ReactNode
  BeforeFields?: React.ReactNode
  collectionSlug?: SanitizedCollectionConfig['slug']
  docPermissions: DocumentPermissions
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  initialData?: Data
  initialState?: FormState
  onSave?: (data: Data) => Promise<void> | void
  action?: string
  apiURL?: string
  docPreferences?: DocumentPreferences
  hasSavePermission?: boolean
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
}

export type DocumentInfo = DocumentInfoProps & {
  docConfig?: SanitizedCollectionConfig | SanitizedGlobalConfig
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  slug?: string
  title?: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
  preferencesKey?: string
}

export type DocumentInfoContext = DocumentInfo & {
  getDocPermissions: () => Promise<void>
  getDocPreferences: () => Promise<{ [key: string]: unknown }>
  getVersions: () => Promise<void>
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  setDocumentInfo?: (info: DocumentInfo) => void
  setDocumentTitle: (title: string) => void
}
