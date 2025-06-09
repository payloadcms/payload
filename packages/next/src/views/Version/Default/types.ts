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
  canUpdate: boolean
  modifiedOnly: boolean
  RenderedDiff: React.ReactNode
  selectedLocales: string[]
  versionFromCreatedAt?: string
  versionFromID?: string
  versionFromOptions: CompareOption[]
  versionTo: TypeWithVersion<any>
  versionToCreatedAtFormatted: string
  VersionToCreatedAtLabel: React.ReactNode
}
