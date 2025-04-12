import type { TypeWithVersion } from 'payload'

export type CompareOption = {
  label: React.ReactNode | string
  value: string
}

export type VersionPill = {
  id: string
  Label: React.ReactNode
}

export type DefaultVersionsViewProps = {
  readonly canUpdate: boolean
  readonly latestDraftVersionID: string
  readonly latestPublishedVersionID: string
  modifiedOnly: boolean
  readonly RenderedDiff: React.ReactNode
  readonly selectedLocales: string[]
  readonly versionFromPill: VersionPill
  readonly versionTo: TypeWithVersion<any>
  versionToCreatedAt: string
  VersionToCreatedAtLabel: React.ReactNode
}
