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
   * Retains the existing `nav` key so saved navigation state remains available
   * without a migration. Branch selection shares this record, allowing
   * `getAdminPreferences` to resolve both in a single query.
   */
  NAV: 'nav',

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
   * Stores the documents the user has pinned in the admin
   */
  PINNED_DOCUMENTS: 'pinned-documents',

  /**
   * Stores the documents the user has recently viewed in the admin
   */
  RECENTLY_VIEWED: 'recently-viewed',
} as const
