export type CompareOption = {
  label: React.ReactNode | string
  value: string
}

export type VersionPill = {
  id: string
  Label: React.ReactNode
}

export type DefaultVersionsViewProps = {
  /**
   * Branch each side of the comparison belongs to, when branching is enabled.
   * Shown alongside the selectors rather than as a field diff: which branch a
   * version came from is metadata about the version, not content of the document.
   */
  branch?: {
    from?: null | string
    to?: null | string
  }
  canUpdate: boolean
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
  versionToStatus?: string
}
