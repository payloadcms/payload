import type {
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithTimestamps,
} from '../../collections/config/types'
import type { CollectionPermission, GlobalPermission } from '../../exports/auth'
import type { PaginatedDocs, TypeWithVersion } from '../../exports/database'
import type { SanitizedGlobalConfig } from '../../exports/types'

export type DocumentPermissions = CollectionPermission | GlobalPermission | null

export type DocumentInfoContext = {
  collectionSlug?: SanitizedCollectionConfig['slug']
  docPermissions: DocumentPermissions
  draftsEnabled?: boolean
  getDocPermissions: () => Promise<void>
  getDocPreferences: () => Promise<{ [key: string]: unknown }>
  getVersions: () => Promise<void>
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  preferencesKey?: string
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  slug?: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
  versionsEnabled?: boolean
}
