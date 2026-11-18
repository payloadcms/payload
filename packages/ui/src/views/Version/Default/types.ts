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
  /** The previous and current file of an upload document. Shown above the field diffs. */
  FileComparison?: React.ReactNode
  modifiedOnly: boolean
  RenderedDiff: React.ReactNode
  selectedLocales: string[]
  versionFromCreatedAt?: string
  versionFromID?: string
  versionFromOptions: CompareOption[]
  versionToCreatedAt?: string
  versionToCreatedAtFormatted: string
  VersionToCreatedAtLabel: React.ReactNode
  versionToID?: string
}
