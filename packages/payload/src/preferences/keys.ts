/**
 * Centralized preference keys used throughout Payload admin UI.
 * Import these constants instead of using string literals to prevent typos.
 */

export const PREFERENCE_KEYS = {
  /**
   * Stores state global to the admin panel, as opposed to state scoped to a
   * collection or a document: the active content branch, navigation group
   * collapse/expand state, and nav open/closed state.
   *
   * Deliberately one key rather than one per concern. An admin render needs all
   * of it, so a single key resolves the lot in a single query — see
   * `getAdminPreferences` in `@payloadcms/ui`. New globally-scoped admin state
   * belongs here rather than in a key of its own.
   */
  ADMIN: 'admin',

  /**
   * Stores dashboard layout configuration
   */
  DASHBOARD_LAYOUT: 'dashboard-layout',

  /**
   * Stores hierarchy tree expand/collapse state per collection
   */
  HIERARCHY_TREE: 'hierarchy-tree',

  /**
   * Stores active sidebar tab selection
   */
  NAV_SIDEBAR_ACTIVE_TAB: 'nav-sidebar-active-tab',

  /**
   * Stores the documents the user has recently viewed in the admin
   */
  RECENTLY_VIEWED: 'recently-viewed',
} as const
