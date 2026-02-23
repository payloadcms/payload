import type React from 'react'
import type { HTMLAttributes } from 'react'

import type { ColumnItemData } from '../HierarchyColumnBrowser/types.js'

export type SelectionWithPath = {
  id: number | string
  path: Array<{ id: number | string; title: string }>
}

export type UseHierarchyDrawerArgs = {
  collectionSlug: string
  Icon?: React.ReactNode
  parentFieldName?: string
  useAsTitle?: string
}

export type HierarchyDrawerProps = {
  readonly hasMany?: boolean
  readonly initialSelections?: (number | string)[]
  readonly onSave: (selections: Map<number | string, SelectionWithPath>) => void
}

export type HierarchyDrawerInternalProps = {
  readonly closeDrawer: () => void
  readonly collectionSlug: string
  readonly drawerSlug: string
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
