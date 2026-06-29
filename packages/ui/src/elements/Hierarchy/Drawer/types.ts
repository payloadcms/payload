import type { Where } from 'payload'
import type React from 'react'
import type { HTMLAttributes } from 'react'

export type SelectionWithPath = {
  id: number | string
  path: Array<{ id: number | string; title: string }>
}

export type UseHierarchyModalArgs = {
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

export type HierarchyModalProps = {
  readonly hasMany?: boolean
  readonly initialSelections?: (number | string)[]
  readonly onMoveToRoot?: () => void
  readonly onSave: (params: {
    closeModal: () => void
    selections: Map<number | string, SelectionWithPath>
  }) => void
  readonly showMoveToRoot?: boolean
}

export type HierarchyModalInternalProps = {
  /** Base filter constraint (e.g., tenant filter) to apply to all queries */
  readonly baseFilter?: null | Where
  readonly closeModal: () => void
  /** IDs that should be disabled (e.g., items being moved can't be selected as destination) */
  readonly disabledIds?: Set<number | string>
  /**
   * When provided, filters hierarchy items to only show those that accept these collections.
   * Used with collectionSpecific hierarchy config.
   */
  readonly filterByCollection?: string[]
  readonly hierarchyCollectionSlug: string
  readonly Icon?: React.ReactNode
  readonly modalSlug: string
  readonly parentFieldName: string
  readonly reopenCount?: number
  readonly useAsTitle?: string
} & HierarchyModalProps

export type HierarchyModalTogglerProps = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  modalSlug?: string
} & HTMLAttributes<HTMLButtonElement>

export type UseHierarchyModal = (args: UseHierarchyModalArgs) => [
  React.FC<HierarchyModalProps>,
  React.FC<Omit<HierarchyModalTogglerProps, 'modalSlug'>>,
  {
    closeModal: () => void
    isModalOpen: boolean
    modalDepth: number
    modalSlug: string
    openModal: () => void
    toggleModal: () => void
  },
]

// Backward-compatible aliases
export type HierarchyDrawerProps = HierarchyModalProps
export type HierarchyDrawerInternalProps = HierarchyModalInternalProps
export type HierarchyDrawerTogglerProps = HierarchyModalTogglerProps

// Re-export column browser types for backwards compatibility
export type { ColumnItemData } from '../ColumnBrowser/types.js'
