import type React from 'react'

import type { CollectionPermission, GlobalPermission } from '../../../../auth/types.js'
import type {
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithTimestamps,
} from '../../../../collections/config/types.js'
import type { PaginatedDocs } from '../../../../database/types.js'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types.js'
import type { TypeWithVersion } from '../../../../versions/types.js'

export type Version = TypeWithVersion<any>

export type DocumentPermissions = CollectionPermission | GlobalPermission | null

export type ContextType = {
  collection?: SanitizedCollectionConfig
  docPermissions: DocumentPermissions
  getDocPermissions: () => Promise<void>
  getDocPreferences: () => Promise<{ [key: string]: unknown }>
  getVersions: () => Promise<void>
  global?: SanitizedGlobalConfig
  id?: number | string
  preferencesKey?: string
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  slug?: string
  unpublishedVersions?: PaginatedDocs<Version>
  versions?: PaginatedDocs<Version>
}

export type Props = {
  children?: React.ReactNode
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  idFromParams?: boolean
}
