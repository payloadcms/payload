import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { OptionObject } from 'payload/types'
import type { Document } from 'payload/types'

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
