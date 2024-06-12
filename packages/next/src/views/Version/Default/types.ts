import type { CollectionPermission, GlobalPermission } from 'payload/bundle'
import type { OptionObject } from 'payload/bundle'
import type { Document } from 'payload/bundle'

export type CompareOption = {
  label: string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  doc: Document
  docPermissions: CollectionPermission | GlobalPermission
  initialComparisonDoc: Document
  localeOptions: OptionObject[]
  mostRecentDoc: Document
  publishedDoc: Document
  versionID?: string
}
