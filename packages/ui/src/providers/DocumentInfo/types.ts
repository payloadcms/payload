import type { PaginatedDocs, TypeWithVersion } from 'payload/database'
import type {
  DocumentPermissions,
  DocumentPreferences,
  InsideFieldsPreferences,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithID,
  TypeWithTimestamps,
} from 'payload/types'
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
  hasSavePermission?: boolean
  id: null | number | string
  isEditing?: boolean
  title?: string
}

export type DocumentInfo = DocumentInfoProps & {
  docConfig?: SanitizedCollectionConfig | SanitizedGlobalConfig
  preferencesKey?: string
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  slug?: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
}

export type DocumentInfoContext = DocumentInfo & {
  getDocPermissions: () => Promise<void>
  getDocPreferences: () => Promise<DocumentPreferences>
  getVersions: () => Promise<void>
  setDocFieldPreferences: (
    field: string,
    fieldPreferences: Partial<InsideFieldsPreferences> & { [key: string]: unknown },
  ) => void
  setDocumentTitle: (title: string) => void
}
