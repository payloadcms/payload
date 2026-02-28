import type React from 'react'

import type { SelectAllStatus } from '../Selection/index.js'

/**
 * The minimum document shape required for selection functionality.
 * Supports document locking to prevent selection of locked documents.
 */
export type SelectableDocument = {
  _isLocked?: boolean
  _userEditing?: { id: string }
  id: number | string
}

/**
 * Collection data passed to the provider, mapping collection slugs to their documents.
 * @template TDoc - The document type, must extend SelectableDocument
 */
export type CollectionData<TDoc extends SelectableDocument = SelectableDocument> = Record<
  string,
  { docs: TDoc[] }
>

/**
 * Selection state for a single collection.
 */
export type CollectionSelectionState = {
  /** Current selection status for this collection (None, Some, AllInPage) */
  selectAllStatus: SelectAllStatus
  /** Map of document IDs to their selection state */
  selected: Map<number | string, boolean>
}

/**
 * Full selection state, keyed by collection slug.
 */
export type SelectionState = Record<string, CollectionSelectionState>

/**
 * Context value providing multi-collection document selection functionality.
 * All methods use single object parameters for backwards compatibility.
 */
export type DocumentSelectionContextValue = {
  /** Clear all selections across all collections */
  clearAll: () => void

  /** Clear all selections for a specific collection */
  clearCollection: (args: { collectionSlug: string }) => void

  /** Get count of selected documents in a specific collection */
  getCollectionCount: (args: { collectionSlug: string }) => number

  /** Get the selection status for a specific collection */
  getSelectAllStatus: (args: { collectionSlug: string }) => SelectAllStatus

  /**
   * Get selections formatted for bulk actions (e.g., DeleteMany).
   * Returns only collections with at least one selection.
   */
  getSelectionsForActions: () => Record<
    string,
    {
      ids: (number | string)[]
      totalCount: number
    }
  >

  /** Get total count of selected documents across all collections */
  getTotalCount: () => number

  /** Check if a specific document is locked (and not editable by current user) */
  isLocked: (args: { collectionSlug: string; id: number | string }) => boolean

  /** Check if a specific document is selected */
  isSelected: (args: { collectionSlug: string; id: number | string }) => boolean

  /** Raw selection state for direct access if needed */
  selections: SelectionState

  /**
   * Toggle selection of all documents in a collection (current page only).
   * Cycles: None -> AllInPage -> None
   */
  toggleAllInCollection: (args: { collectionSlug: string }) => void

  /**
   * Toggle selection state of a single document.
   * Will not select locked documents unless the current user is editing them.
   */
  toggleSelection: (args: { collectionSlug: string; id: number | string }) => void
}

/**
 * Props for the DocumentSelectionProvider component.
 * @template TDoc - The document type, must extend SelectableDocument
 */
export type DocumentSelectionProviderProps<TDoc extends SelectableDocument = SelectableDocument> = {
  /** React children to render within the provider */
  readonly children: React.ReactNode
  /** Collection data mapping slugs to their documents */
  readonly collectionData: CollectionData<TDoc>
  /** Current user ID for determining document lock status */
  readonly currentUserId?: string
}
