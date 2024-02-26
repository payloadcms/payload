import type { Option } from '@payloadcms/ui'
import type { CollectionPermission, GlobalPermission, Permissions, User } from 'payload/auth'
import type { Document, SanitizedCollectionConfig } from 'payload/types'

export type CompareOption = {
  label: string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  collectionSlug?: SanitizedCollectionConfig['slug']
  doc: Document
  docPermissions: CollectionPermission | GlobalPermission
  globalSlug?: SanitizedCollectionConfig['slug']
  id?: number | string
  initialComparisonDoc: Document
  localeOptions: Option[]
  mostRecentDoc: Document
  permissions: Permissions
  publishedDoc: Document
  user: User
  versionID?: string
}
