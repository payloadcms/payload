import type { DocumentPermissions } from '../../auth'
import type {
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithTimestamps,
} from '../../collections/config/types'
import type { PaginatedDocs, TypeWithVersion } from '../../exports/database'
import type { SanitizedGlobalConfig } from '../../globals/config/types'

export type DocumentInfoContext = {
  collectionSlug?: SanitizedCollectionConfig['slug']
  docPermissions: DocumentPermissions
  getDocPermissions: () => Promise<void>
  getDocPreferences: () => Promise<{ [key: string]: unknown }>
  getVersions: () => Promise<void>
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  preferencesKey?: string
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  setDocumentInfo?: (
    info: Partial<{
      collectionSlug: SanitizedCollectionConfig['slug']
      globalSlug: SanitizedGlobalConfig['slug']
      id: number | string
      versionsConfig: SanitizedCollectionConfig['versions'] | SanitizedGlobalConfig['versions']
    }>,
  ) => void
  slug?: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsConfig?: SanitizedCollectionConfig['versions'] | SanitizedGlobalConfig['versions']
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
}
