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
  hasSelectedDescendants: boolean
  isExpanded: boolean
  isSelected: boolean
  item: ColumnItemData
  onExpand: (params: { id: number | string }) => void
  onSelect: (params: { id: number | string }) => void
}

export type ColumnProps = {
  ancestorsWithSelections: Set<number | string>
  /** Whether user can create new documents */
  canCreate: boolean
  /** Label for the collection (e.g., "Folder") */
  collectionLabel: string
  disabled?: boolean
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  disabledIds?: Set<number | string>
  expandedId: null | number | string
  /** Required collections for superset check (passed to ColumnItem) */
  filterByCollection?: string[]
  hasNextPage: boolean
  isLoading: boolean
  items: ColumnItemData[]
  /** Called when user clicks "New" button - parent should open drawer with parentId */
  onCreateNew: (params: { parentId: null | number | string }) => void
  onExpand: (params: { id: number | string }) => void
  onLoadMore: () => void
  onSelect: (params: { id: number | string; path: PathSegment[] }) => void
  parentId: null | number | string
  parentTitle?: string
  pathToColumn: PathSegment[]
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
}

export type HierarchyColumnBrowserProps = {
  ancestorsWithSelections: Set<number | string>
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
  hierarchyCollectionSlug: string
  initialExpandedPath?: (number | string)[]
  /** Whether the initial expanded path is still being loaded */
  isLoadingPath?: boolean
  /** Called when user clicks "New" button to create a new item */
  onCreateNew?: (params: { parentId: null | number | string }) => void
  onSelect: (params: { id: number | string; path: PathSegment[] }) => void
  parentFieldName: string
  selectedIds: Set<number | string>
  useAsTitle?: string
}
