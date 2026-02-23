import type React from 'react'

export type ColumnItemData = {
  hasChildren: boolean
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
  onSelect: (id: number | string) => void
  parentFieldName: string
  parentId: null | number | string
  parentTitle?: string
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
  onSelect: (id: number | string) => void
  parentFieldName: string
  selectedIds: Set<number | string>
  useAsTitle?: string
}
