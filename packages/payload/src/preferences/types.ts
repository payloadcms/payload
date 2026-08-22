import type { NavGroupPreferences } from '../admin/elements/Nav.js'
import type { DefaultDocumentIDType } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

/**
 * The `admin` preference value: the stored shape of everything global to the
 * admin panel. Read once per admin render, so each addition here is free rather
 * than another query.
 */
export type AdminPreferences = {
  /**
   * Slug of the content branch the user is working on.
   *
   * A preference rather than a cookie so the selection follows the user across
   * browsers and machines.
   */
  branch?: string
  /** Collapse/expand state per navigation group, keyed by group label. */
  groups?: NavGroupPreferences
  /** Whether the nav sidebar is open. */
  open?: boolean
}

export type PreferenceRequest = {
  key: string
  overrideAccess?: boolean
  req: PayloadRequest
  user: PayloadRequest['user']
}

export type PreferenceUpdateRequest = { value: unknown } & PreferenceRequest

export type CollapsedPreferences = string[]

export type TabsPreferences = Array<{
  [path: string]: number
}>

export type InsideFieldsPreferences = {
  collapsed: CollapsedPreferences
  tabIndex: number
}

export type FieldsPreferences = {
  [key: string]: InsideFieldsPreferences
}

export type DocumentPreferences = {
  fields: FieldsPreferences
}

export type ColumnPreference = {
  accessor: string
  active: boolean
}

export type CollectionPreferences = {
  columns?: ColumnPreference[]
  editViewType?: 'default' | 'live-preview'
  groupBy?: string
  limit?: number
  listViewType?: 'hierarchy' | 'list'
  preset?: DefaultDocumentIDType
  sort?: string
}

/**
 * A single document the user has viewed in the admin. Only identity and timestamp are stored;
 * display fields (title, thumbnail, etc.) are computed at render time from the live document.
 */
export type RecentlyViewedItem = {
  collectionSlug: string
  id: DefaultDocumentIDType
  viewedAt: string
}

/**
 * The `recently-viewed` preference value: the user's recently viewed documents, most recent first.
 */
export type RecentlyViewedPreferences = {
  items: RecentlyViewedItem[]
}
