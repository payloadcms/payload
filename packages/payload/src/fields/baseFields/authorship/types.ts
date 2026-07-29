/**
 * Controls the automatic `createdBy` / `updatedBy` user-tracking fields.
 *
 * Pass `true` (default) to enable both, `false` to disable both, or an object
 * to toggle each field independently.
 */
export type Authorship = {
  /**
   * Track the user that created the document via a `createdBy` field.
   *
   * @default true
   */
  createdBy?: boolean
  /**
   * Track the user that last updated the document via an `updatedBy` field.
   *
   * @default true
   */
  updatedBy?: boolean
}

/**
 * The sanitized, canonical form of {@link Authorship}. Booleans are always resolved.
 */
export type SanitizedAuthorship = {
  createdBy: boolean
  updatedBy: boolean
}
