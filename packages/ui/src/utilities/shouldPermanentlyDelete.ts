type ShouldPermanentlyDeleteArgs = {
  /** Whether the user checked the "delete permanently" checkbox in the UI */
  deletePermanently: boolean
  hasDeletePermission: boolean
  hasTrashPermission: boolean
  isTrashView?: boolean
}

/**
 * Determines whether a delete operation should permanently remove documents or soft-delete them to trash.
 */
export function shouldPermanentlyDelete({
  deletePermanently,
  hasDeletePermission,
  hasTrashPermission,
  isTrashView = false,
}: ShouldPermanentlyDeleteArgs): boolean {
  return isTrashView || !hasTrashPermission || (hasDeletePermission && deletePermanently)
}
