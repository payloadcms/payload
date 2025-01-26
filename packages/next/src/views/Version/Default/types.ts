import type {
  Document,
  OptionObject,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import type { VersionState } from '../buildVersionState.js'

export type CompareOption = {
  label: React.ReactNode | string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  readonly doc: Document
  readonly docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  readonly initialComparisonDoc: Document
  readonly latestDraftVersion?: string
  readonly latestPublishedVersion?: string
  readonly localeOptions: OptionObject[]
  readonly versionID?: string
  readonly versionState: VersionState
}
