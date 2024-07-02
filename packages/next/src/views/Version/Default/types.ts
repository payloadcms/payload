import type { CollectionPermission, Document, GlobalPermission, OptionObject } from 'payload'

export type CompareOption = {
  label: React.ReactNode | string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  doc: Document
  docPermissions: CollectionPermission | GlobalPermission
  initialComparisonDoc: Document
  latestDraftVersion?: string
  latestPublishedVersion?: string
  localeOptions: OptionObject[]
  versionID?: string
}
