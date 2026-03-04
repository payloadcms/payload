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
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  disabledIds?: Set<number | string>
  /** Required collections that the folder must allow (for superset check) */
  filterByCollection?: string[]
  hasSelectedDescendants: boolean
  isExpanded: boolean
  isSelected: boolean
  item: ColumnItemData
  onExpand: (id: number | string) => void
  onSelect: (id: number | string) => void
}

export type ColumnProps = {
  ancestorsWithSelections: Set<number | string>
  collectionSlug: string
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  disabledIds?: Set<number | string>
  expandedId: null | number | string
  /** Required collections for superset check (passed to ColumnItem) */
  filterByCollection?: string[]
  hasNextPage: boolean
  isLoading: boolean
  items: ColumnItemData[]
  onDocumentCreated: (doc: ColumnItemData) => void
  onExpand: (id: number | string) => void
  onLoadMore: () => void
  onSelect: (id: number | string, path: PathSegment[]) => void
  parentFieldName: string
  parentId: null | number | string
  parentTitle?: string
  pathToColumn: PathSegment[]
  selectedIds: Set<number | string>
  totalDocs: number
  useAsTitle: string
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

export type HierarchyColumnBrowserProps = {
  ancestorsWithSelections: Set<number | string>
  collectionSlug: string
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
  initialExpandedPath?: (number | string)[]
  onSelect: (id: number | string, path: PathSegment[]) => void
  parentFieldName: string
  selectedIds: Set<number | string>
  useAsTitle?: string
}
