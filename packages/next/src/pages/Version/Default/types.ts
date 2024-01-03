import {
  CollectionPermission,
  FieldPermissions,
  GlobalPermission,
  Permissions,
  User,
} from 'payload/auth'
import {
  Document,
  Field,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

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
  compareDoc: Document
  fields: Field[]
  locales: CompareOption[]
  user: User
  permissions: Permissions
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: string
  versionID?: string
  docPermissions: CollectionPermission | GlobalPermission
  locale: string
}
