import type React from 'react'

import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { SanitizedCollectionConfig, TypeWithID, SanitizedGlobalConfig } from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import type { TypeWithTimestamps } from 'payload/dist/collections/config/types'
import { TypeWithVersion } from 'payload/database'

export type Version = TypeWithVersion<any>

export type DocumentPermissions = CollectionPermission | GlobalPermission | null

export type ContextType = {
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
  slug?: string
  unpublishedVersions?: PaginatedDocs<Version>
  versionsCount?: PaginatedDocs<Version>
  draftsEnabled?: boolean
  versionsEnabled?: boolean
}

export type Props = {
  children?: React.ReactNode
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  idFromParams?: boolean
  draftsEnabled?: boolean
  versionsEnabled?: boolean
}
