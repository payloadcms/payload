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
  docConfig?: SanitizedCollectionConfig | SanitizedGlobalConfig
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
    }>,
  ) => void
  setDocumentTitle: (title: string) => void
  slug?: string
  title?: string
  unpublishedVersions?: PaginatedDocs<TypeWithVersion<any>>
  versions?: PaginatedDocs<TypeWithVersion<any>>
  versionsCount?: PaginatedDocs<TypeWithVersion<any>>
}
