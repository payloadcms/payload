import type React from 'react'
import type { HTMLAttributes } from 'react'

export type SelectionWithPath = {
  id: number | string
  path: Array<{ id: number | string; title: string }>
}

export type UseTaxonomyDrawerArgs = {
  Icon?: React.ReactNode
  parentFieldName?: string
  taxonomySlug: string
  useAsTitle?: string
}

export type TaxonomyDrawerProps = {
  readonly hasMany?: boolean
  readonly initialSelections?: (number | string)[]
  readonly onSave: (selections: Map<number | string, SelectionWithPath>) => void
}

export type TaxonomyDrawerInternalProps = {
  readonly closeDrawer: () => void
  readonly drawerSlug: string
  readonly Icon?: React.ReactNode
  readonly parentFieldName: string
  readonly taxonomySlug: string
  readonly useAsTitle?: string
} & TaxonomyDrawerProps

export type TaxonomyDrawerTogglerProps = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  drawerSlug?: string
} & HTMLAttributes<HTMLButtonElement>

export type UseTaxonomyDrawer = (args: UseTaxonomyDrawerArgs) => [
  React.FC<TaxonomyDrawerProps>,
  React.FC<Omit<TaxonomyDrawerTogglerProps, 'drawerSlug'>>,
  {
    closeDrawer: () => void
    drawerDepth: number
    drawerSlug: string
    isDrawerOpen: boolean
    openDrawer: () => void
    toggleDrawer: () => void
  },
]

// Column browser types

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
  taxonomySlug: string
  totalDocs: number
  useAsTitle: string
}

// ColumnBrowser types

export type ColumnState = {
  hasNextPage: boolean
  isLoading: boolean
  items: ColumnItemData[]
  page: number
  parentId: null | number | string
  parentTitle?: string
  totalDocs: number
}

export type ColumnBrowserProps = {
  ancestorsWithSelections: Set<number | string>
  onSelect: (id: number | string) => void
  parentFieldName: string
  selectedIds: Set<number | string>
  taxonomySlug: string
  useAsTitle?: string
}
