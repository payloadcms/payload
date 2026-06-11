import type { SanitizedDocumentPermissions } from 'payload'

type IsNavEntityVisibleArgs = {
  /** The entity's `admin.group`; an explicit `false` removes it from nav grouping. */
  adminGroup: false | Record<string, string> | string | undefined
  /** The current user's resolved permissions for this entity, if any. */
  entityPermissions: SanitizedDocumentPermissions | undefined
}

/**
 * Shared nav-visibility rule for collections and globals: an entity is shown when it
 * isn't explicitly removed from grouping (`admin.group: false`) and the user has read
 * permission. Entity-level `admin.hidden` is handled separately via `visibleEntities`.
 * Used by both the sidebar nav (`groupNavItems`) and the command palette so the two
 * surfaces stay in sync.
 */
export function isNavEntityVisible({
  adminGroup,
  entityPermissions,
}: IsNavEntityVisibleArgs): boolean {
  if (adminGroup === false) {
    return false
  }

  return Boolean(entityPermissions?.read)
}
