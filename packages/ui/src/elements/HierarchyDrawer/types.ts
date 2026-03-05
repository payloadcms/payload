import type React from 'react'
import type { HTMLAttributes } from 'react'

export type SelectionWithPath = {
  id: number | string
  path: Array<{ id: number | string; title: string }>
}

export type UseHierarchyDrawerArgs = {
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  disabledIds?: Set<number | string>
  /**
   * When provided, filters hierarchy items to only show those that accept these collections.
   * Used with collectionSpecific hierarchy config.
   */
  filterByCollection?: string[]
  hierarchyCollectionSlug: string
  Icon?: React.ReactNode
}

export type HierarchyDrawerProps = {
  readonly hasMany?: boolean
  readonly initialSelections?: (number | string)[]
  readonly onMoveToRoot?: () => void
  readonly onSave: (
    selections: Map<number | string, SelectionWithPath>,
    closeDrawer: () => void,
  ) => void
  readonly showMoveToRoot?: boolean
}

export type HierarchyDrawerInternalProps = {
  readonly closeDrawer: () => void
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  readonly disabledIds?: Set<number | string>
  readonly drawerSlug: string
  /**
   * When provided, filters hierarchy items to only show those that accept these collections.
   * Used with collectionSpecific hierarchy config.
   */
  readonly filterByCollection?: string[]
  readonly hierarchyCollectionSlug: string
  readonly Icon?: React.ReactNode
  readonly parentFieldName: string
  readonly useAsTitle?: string
} & HierarchyDrawerProps

export type HierarchyDrawerTogglerProps = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  drawerSlug?: string
} & HTMLAttributes<HTMLButtonElement>

export type UseHierarchyDrawer = (args: UseHierarchyDrawerArgs) => [
  React.FC<HierarchyDrawerProps>,
  React.FC<Omit<HierarchyDrawerTogglerProps, 'drawerSlug'>>,
  {
    closeDrawer: () => void
    drawerDepth: number
    drawerSlug: string
    isDrawerOpen: boolean
    openDrawer: () => void
    toggleDrawer: () => void
  },
]

// Re-export column browser types for backwards compatibility
export type { ColumnItemData } from '../HierarchyColumnBrowser/types.js'
