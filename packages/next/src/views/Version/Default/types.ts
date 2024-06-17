import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { Document , OptionObject } from 'payload/types'

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
