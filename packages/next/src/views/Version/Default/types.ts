import type { Document, OptionObject } from 'payload'

export type CompareOption = {
  label: React.ReactNode | string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type DefaultVersionsViewProps = {
  readonly canUpdate: boolean
  readonly doc: Document
  readonly latestDraftVersion?: string
  readonly latestPublishedVersion?: string
  modifiedOnly: boolean
  readonly RenderedDiff: React.ReactNode
  readonly selectedLocales: OptionObject[]
  readonly versionID?: string
}
