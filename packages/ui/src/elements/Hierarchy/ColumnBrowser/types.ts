import type { Where } from 'payload'
import type React from 'react'

export type ColumnItemData = {
  /** For folders with collectionSpecific config, the allowed collection slugs */
  allowedCollections?: string[]
  hasChildren: boolean
  id: number | string
  title: string
}

export type PathSegment = {
  id: number | string
  title: string
}

export type ColumnItemProps = {
  disabled?: boolean
  /** Required collections that the folder must allow (for superset check) */
  filterByCollection?: string[]
  /** Multi-select shows a checkbox; single-select marks the selected row with a ring instead */
  hasMany?: boolean
  isExpanded: boolean
  isSelected: boolean
  item: ColumnItemData
  onExpand: (params: { id: number | string }) => void
  onSelect: (params: { id: number | string }) => void
  /**
   * Set when this item is the target of a `revealPath` call - it scrolls itself into view and
   * takes focus. The value changes on every reveal so repeat reveals of the same item re-fire.
   */
  revealToken?: number
  /** How many selected items live below this one, shown as a badge beside the chevron */
  selectedDescendantCount: number
}

export type ColumnProps = {
  /** Whether user can create new documents */
  canCreate: boolean
  /** Label for the collection (e.g., "Folder") */
  collectionLabel: string
  /** Plural label for the collection (e.g., "Folders") */
  collectionLabelPlural: string
  disabled?: boolean
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  disabledIds?: Set<number | string>
  expandedId: null | number | string
  /** Required collections for superset check (passed to ColumnItem) */
  filterByCollection?: string[]
  hasMany?: boolean
  hasNextPage: boolean
  isLoading: boolean
  items: ColumnItemData[]
  /** Called when user clicks "New" button - parent should open modal with parentId */
  onCreateNew: (params: { parentId: null | number | string }) => void
  onExpand: (params: { id: number | string }) => void
  onLoadMore: () => void
  onSelect: (params: { id: number | string; path: PathSegment[] }) => void
  parentId: null | number | string
  parentTitle?: string
  pathToColumn: PathSegment[]
  /** Item to scroll into view and focus, if it lives in this column */
  revealedId?: null | number | string
  revealToken?: number
  /** Number of selected items nested under each ancestor, keyed by ancestor ID */
  selectedDescendantCounts: Map<number | string, number>
  selectedIds: Set<number | string>
  totalDocs: number
}

export type ColumnState = {
  hasNextPage: boolean
  isLoading: boolean
  items: ColumnItemData[]
  page: number
  parentId: null | number | string
  parentTitle?: string
  totalDocs: number
}

export type HierarchyColumnBrowserRef = {
  /** Refetch a specific column by parentId */
  refreshColumn: (parentId: null | number | string) => Promise<void>
  /**
   * Expand the columns down to the last segment of `path`, then scroll it into view and focus it.
   * Does not change the current selection.
   */
  revealPath: (path: PathSegment[]) => Promise<void>
}

export type HierarchyColumnBrowserProps = {
  /** Base filter constraint (e.g., tenant filter) to apply to all queries */
  baseFilter?: null | Where
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  disabledIds?: Set<number | string>
  /**
   * Filters hierarchy items based on collection type restrictions:
   * - `undefined`: No filtering, show all folders
   * - `[]` (empty array): No filtering, show all folders (no constraints)
   * - `['posts', ...]`: Show folders accepting ANY of these collections OR unrestricted folders
   *
   * Note: Query uses ANY semantics due to PG hasMany enum limitations.
   * Client-side enforcement can disable selection of folders that don't allow ALL required collections.
   */
  filterByCollection?: string[]
  /** Multi-select shows a checkbox per row; single-select rings the selected row instead */
  hasMany?: boolean
  hierarchyCollectionSlug: string
  initialExpandedPath?: (number | string)[]
  /** Whether the initial expanded path is still being loaded */
  isLoadingPath?: boolean
  /** Called when user clicks "New" button to create a new item */
  onCreateNew?: (params: { parentId: null | number | string }) => void
  onSelect: (params: { id: number | string; path: PathSegment[] }) => void
  parentFieldName: string
  /** Number of selected items nested under each ancestor, keyed by ancestor ID */
  selectedDescendantCounts: Map<number | string, number>
  selectedIds: Set<number | string>
  useAsTitle?: string
}
