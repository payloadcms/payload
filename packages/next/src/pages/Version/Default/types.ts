import { Option } from '@payloadcms/ui'
import { CollectionPermission, GlobalPermission, Permissions, User } from 'payload/auth'

import { Document, SanitizedCollectionConfig } from 'payload/types'

export type CompareOption = {
  label: string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  doc: Document
  mostRecentDoc: Document
  publishedDoc: Document
  initialComparisonDoc: Document
  localeOptions: Option[]
  user: User
  permissions: Permissions
  id?: string | number
  versionID?: string
  docPermissions: CollectionPermission | GlobalPermission
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedCollectionConfig['slug']
}
