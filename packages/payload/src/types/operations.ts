/** The document snapshot used for a read or update. */
export type DocumentVersion = 'draft' | 'latest' | 'published'

export type SharedLocalAPIOptions = {
  /**
   * Set to `true` to skip access control for this operation.
   *
   * @default false
   */
  overrideAccess?: boolean
}
