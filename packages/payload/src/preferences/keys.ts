/**
 * Centralized preference keys used throughout Payload admin UI.
 * Import these constants instead of using string literals to prevent typos.
 */

export const PREFERENCE_KEYS = {
  /**
   * Stores the content branch the user is currently working on.
   *
   * A preference rather than a cookie so the selection follows the user across
   * devices, and so it is the same store the rest of the admin UI state uses.
   */
  BRANCH: 'branch',

  /**
   * Stores dashboard layout configuration
   */
  DASHBOARD_LAYOUT: 'dashboard-layout',

  /**
   * Stores hierarchy tree expand/collapse state per collection
   */
  HIERARCHY_TREE: 'hierarchy-tree',

  /**
   * Stores navigation group collapse/expand state and nav open/closed state
   */
  NAV: 'nav',

  /**
   * Stores active sidebar tab selection
   */
  NAV_SIDEBAR_ACTIVE_TAB: 'nav-sidebar-active-tab',

  /**
   * Stores the documents the user has recently viewed in the admin
   */
  RECENTLY_VIEWED: 'recently-viewed',
} as const
