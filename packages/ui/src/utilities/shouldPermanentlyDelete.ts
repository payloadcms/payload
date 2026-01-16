type ShouldPermanentlyDeleteArgs = {
  /** Whether the user checked the "delete permanently" checkbox in the UI */
  deletePermanently: boolean
  /** Whether the user has permission to permanently delete documents */
  hasDeletePermission: boolean
  /** Whether the user has permission to trash (soft delete) documents. False when trash is disabled. */
  hasTrashPermission: boolean
  /**
   * Whether the delete action is being performed from the trash view.
   * @default false
   */
  isTrashView?: boolean
}

/**
 * Determines whether a delete operation should permanently remove documents or soft-delete them to trash.
 *
 * Returns `true` (permanent delete) when:
 * - In trash view (deleting from trash always means permanent deletion)
 * - User lacks trash permission (includes when trash is disabled on the collection)
 * - User has delete permission AND checked "delete permanently"
 *
 * Returns `false` (soft delete to trash) otherwise.
 */
export function shouldPermanentlyDelete({
  deletePermanently,
  hasDeletePermission,
  hasTrashPermission,
  isTrashView = false,
}: ShouldPermanentlyDeleteArgs): boolean {
  return isTrashView || !hasTrashPermission || (hasDeletePermission && deletePermanently)
}
