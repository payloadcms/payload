import type { CollectionPermission, Document, GlobalPermission, OptionObject } from 'payload'

export type CompareOption = {
  label: React.ReactNode | string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  readonly doc: Document
  readonly docPermissions: CollectionPermission | GlobalPermission
  readonly initialComparisonDoc: Document
  readonly latestDraftVersion?: string
  readonly latestPublishedVersion?: string
  readonly localeOptions: OptionObject[]
  readonly versionID?: string
}
