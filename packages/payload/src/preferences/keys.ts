/**
 * Centralized preference keys used throughout Payload admin UI.
 * Import these constants instead of using string literals to prevent typos.
 */

export const PREFERENCE_KEYS = {
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
} as const
