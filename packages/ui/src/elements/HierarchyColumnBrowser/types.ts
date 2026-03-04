import type React from 'react'

export type ColumnItemData = {
  hasChildren: boolean
  id: number | string
  title: string
}

export type PathSegment = {
  id: number | string
  title: string
}

export type ColumnItemProps = {
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
  expandedId: null | number | string
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
