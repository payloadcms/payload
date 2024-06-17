import type { CollectionPermission, Document, GlobalPermission, OptionObject } from 'payload'

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
