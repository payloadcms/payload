'use client'
import type React from 'react'

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  CollectionData,
  CollectionSelectionState,
  DocumentSelectionContextValue,
  DocumentSelectionProviderProps,
  SelectableDocument,
  SelectionDocument,
  SelectionMetadata,
  SelectionState,
} from './types.js'

import { SelectAllStatus } from '../Selection/index.js'
import { getVisibleSelectionStatus, isSelectionDocumentLocked } from './incremental.js'
import { useIncrementalSelection } from './useIncrementalSelection.js'

export { SelectAllStatus }
export type {
  CollectionData,
  CollectionSelectionState,
  DocumentSelectionContextValue,
  DocumentSelectionProviderProps,
  SelectableDocument,
  SelectionDocument,
  SelectionMetadata,
  SelectionState,
}

const Context = createContext<DocumentSelectionContextValue | undefined>(undefined)

/**
 * Creates an initial empty selection state for a collection.
 */
const createEmptyCollectionState = (): CollectionSelectionState => ({
  selectAllStatus: SelectAllStatus.None,
  selected: new Map(),
})

/**
 * Computes the SelectAllStatus based on selection state and doc count.
 * Presence in the map = selected (metadata object is stored).
 */
const computeSelectAllStatus = ({
  docCount,
  selected,
}: {
  docCount: number
  selected: Map<number | string, SelectionMetadata>
}): SelectAllStatus => {
  if (!selected.size || docCount === 0) {
    return SelectAllStatus.None
  }

  if (selected.size === docCount) {
    return SelectAllStatus.AllInPage
  }

  return SelectAllStatus.Some
}

export const DocumentSelectionProvider: React.FC<DocumentSelectionProviderProps> = ({
  children,
  collectionData,
  currentUserId,
  selectionScopeKey,
}) => {
  const contextRef = useRef({} as DocumentSelectionContextValue)

  const {
    clearAll: clearAllIncremental,
    clearCollection: clearIncrementalCollection,
    registerVisibleDocuments,
    state: incrementalState,
    toggleAllInCollection: toggleAllIncremental,
    toggleSelection: toggleIncremental,
  } = useIncrementalSelection({ currentUserId, selectionScopeKey })
  const hasIncrementalSelection = selectionScopeKey !== undefined
  const [legacySelections, setSelections] = useState<SelectionState>(() => {
    const initial: SelectionState = {}

    for (const collectionSlug of Object.keys(collectionData)) {
      initial[collectionSlug] = createEmptyCollectionState()
    }

    return initial
  })

  const selections = hasIncrementalSelection ? incrementalState.selections : legacySelections

  // Reset selections when collectionData changes (new docs loaded)
  useEffect(() => {
    if (hasIncrementalSelection) {
      return
    }
    setSelections(() => {
      const reset: SelectionState = {}

      for (const collectionSlug of Object.keys(collectionData)) {
        reset[collectionSlug] = createEmptyCollectionState()
      }

      return reset
    })
  }, [collectionData, hasIncrementalSelection])

  const isLocked = useCallback(
    ({ id, collectionSlug }: { collectionSlug: string; id: number | string }): boolean => {
      if (hasIncrementalSelection) {
        const entry = incrementalState.known.get(JSON.stringify([collectionSlug, id]))

        return entry ? isSelectionDocumentLocked({ currentUserId, entry }) : false
      }
      const docs = collectionData[collectionSlug]?.docs ?? []
      const doc = docs.find((d) => d.id === id)

      if (!doc) {
        return false
      }

      return Boolean(doc._isLocked && doc._userEditing?.id !== currentUserId)
    },
    [collectionData, currentUserId, hasIncrementalSelection, incrementalState.known],
  )

  const isSelected = useCallback(
    ({ id, collectionSlug }: { collectionSlug: string; id: number | string }): boolean => {
      return selections[collectionSlug]?.selected.has(id) ?? false
    },
    [selections],
  )

  const getSelectAllStatus = useCallback(
    ({ collectionSlug }: { collectionSlug: string }): SelectAllStatus => {
      if (hasIncrementalSelection) {
        return getVisibleSelectionStatus({
          collectionSlug,
          currentUserId,
          state: incrementalState,
        })
      }
      return selections[collectionSlug]?.selectAllStatus ?? SelectAllStatus.None
    },
    [currentUserId, hasIncrementalSelection, incrementalState, selections],
  )

  const getCollectionCount = useCallback(
    ({ collectionSlug }: { collectionSlug: string }): number => {
      return selections[collectionSlug]?.selected.size ?? 0
    },
    [selections],
  )

  const getTotalCount = useCallback((): number => {
    let total = 0

    for (const collectionSlug of Object.keys(selections)) {
      total += getCollectionCount({ collectionSlug })
    }

    return total
  }, [selections, getCollectionCount])

  const getSelectionsForActions = useCallback((): Record<
    string,
    { ids: (number | string)[]; totalCount: number }
  > => {
    const result: Record<string, { ids: (number | string)[]; totalCount: number }> = {}

    for (const [collectionSlug, collectionState] of Object.entries(selections)) {
      const ids = Array.from(collectionState.selected.keys())

      if (ids.length > 0) {
        result[collectionSlug] = {
          ids,
          totalCount: ids.length,
        }
      }
    }

    return result
  }, [selections])

  const getSelectionsWithMetadata = useCallback((): Record<
    string,
    {
      selections: Array<{ id: number | string; metadata: SelectionMetadata }>
      totalCount: number
    }
  > => {
    const result: Record<
      string,
      {
        selections: Array<{ id: number | string; metadata: SelectionMetadata }>
        totalCount: number
      }
    > = {}

    for (const [collectionSlug, collectionState] of Object.entries(selections)) {
      const selectionsArray: Array<{ id: number | string; metadata: SelectionMetadata }> = []

      for (const [id, metadata] of collectionState.selected) {
        selectionsArray.push({ id, metadata })
      }

      if (selectionsArray.length > 0) {
        result[collectionSlug] = {
          selections: selectionsArray,
          totalCount: selectionsArray.length,
        }
      }
    }

    return result
  }, [selections])

  const toggleSelection = useCallback(
    ({
      id,
      collectionSlug,
      metadata,
    }: {
      collectionSlug: string
      id: number | string
      metadata?: SelectionMetadata
    }): void => {
      if (hasIncrementalSelection) {
        toggleIncremental({ id, collectionSlug, metadata })
        return
      }
      // Check if doc is locked
      if (isLocked({ id, collectionSlug })) {
        return
      }

      setSelections((prev) => {
        const collectionState = prev[collectionSlug] ?? createEmptyCollectionState()
        const isCurrentlySelected = collectionState.selected.has(id)

        const newMap = new Map(collectionState.selected)

        if (isCurrentlySelected) {
          newMap.delete(id)
        } else {
          newMap.set(id, metadata ?? {})
        }

        const docCount = collectionData[collectionSlug]?.docs.length ?? 0
        const newSelectAllStatus = computeSelectAllStatus({ docCount, selected: newMap })

        return {
          ...prev,
          [collectionSlug]: {
            selectAllStatus: newSelectAllStatus,
            selected: newMap,
          },
        }
      })
    },
    [collectionData, hasIncrementalSelection, toggleIncremental, isLocked],
  )

  const toggleAllInCollection = useCallback(
    ({ collectionSlug }: { collectionSlug: string }): void => {
      if (hasIncrementalSelection) {
        toggleAllIncremental({ collectionSlug })
        return
      }
      setSelections((prev) => {
        const collectionState = prev[collectionSlug] ?? createEmptyCollectionState()
        const docs = collectionData[collectionSlug]?.docs ?? []
        const currentStatus = collectionState.selectAllStatus

        // If already AllInPage, reset to None
        if (currentStatus === SelectAllStatus.AllInPage) {
          return {
            ...prev,
            [collectionSlug]: {
              selectAllStatus: SelectAllStatus.None,
              selected: new Map(),
            },
          }
        }

        // Otherwise, select all non-locked docs with empty metadata
        const newMap = new Map<number | string, SelectionMetadata>()

        for (const doc of docs) {
          const docIsLocked = Boolean(doc._isLocked && doc._userEditing?.id !== currentUserId)

          if (!docIsLocked) {
            newMap.set(doc.id, {})
          }
        }

        const newSelectAllStatus = computeSelectAllStatus({
          docCount: docs.length,
          selected: newMap,
        })

        return {
          ...prev,
          [collectionSlug]: {
            selectAllStatus: newSelectAllStatus,
            selected: newMap,
          },
        }
      })
    },
    [collectionData, currentUserId, hasIncrementalSelection, toggleAllIncremental],
  )

  const clearCollection = useCallback(
    ({ collectionSlug }: { collectionSlug: string }): void => {
      if (hasIncrementalSelection) {
        clearIncrementalCollection({ collectionSlug })
        return
      }
      setSelections((prev) => ({
        ...prev,
        [collectionSlug]: createEmptyCollectionState(),
      }))
    },
    [hasIncrementalSelection, clearIncrementalCollection],
  )

  const clearAll = useCallback((): void => {
    if (hasIncrementalSelection) {
      clearAllIncremental()
      return
    }
    setSelections((prev) => {
      const cleared: SelectionState = {}

      for (const collectionSlug of Object.keys(prev)) {
        cleared[collectionSlug] = createEmptyCollectionState()
      }

      return cleared
    })
  }, [hasIncrementalSelection, clearAllIncremental])

  const contextValue = useMemo<DocumentSelectionContextValue>(
    () => ({
      clearAll,
      clearCollection,
      getCollectionCount,
      getSelectAllStatus,
      getSelectionsForActions,
      getSelectionsWithMetadata,
      getTotalCount,
      isLocked,
      isSelected,
      registerVisibleDocuments: hasIncrementalSelection ? registerVisibleDocuments : undefined,
      selections,
      toggleAllInCollection,
      toggleSelection,
    }),
    [
      clearAll,
      clearCollection,
      getCollectionCount,
      getSelectAllStatus,
      getSelectionsForActions,
      getSelectionsWithMetadata,
      getTotalCount,
      isLocked,
      isSelected,
      hasIncrementalSelection,
      registerVisibleDocuments,
      selections,
      toggleAllInCollection,
      toggleSelection,
    ],
  )

  contextRef.current = contextValue

  return <Context value={contextRef.current}>{children}</Context>
}

export const useDocumentSelection = (): DocumentSelectionContextValue => {
  const context = use(Context)

  if (context === undefined) {
    throw new Error('useDocumentSelection must be used within a DocumentSelectionProvider')
  }

  return context
}
