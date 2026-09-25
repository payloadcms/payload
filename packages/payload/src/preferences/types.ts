import type { DefaultDocumentIDType } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

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
