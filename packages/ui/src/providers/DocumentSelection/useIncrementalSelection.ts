'use client'

import { useCallback, useState } from 'react'

import type { IncrementalSelection } from './incremental.js'
import type { SelectionDocument } from './types.js'

import {
  createIncrementalSelection,
  registerSelectionDocuments,
  toggleIncrementalDocument,
  toggleVisibleSelection,
} from './incremental.js'

export function useIncrementalSelection({
  currentUserId,
  selectionScopeKey,
}: {
  currentUserId?: string
  selectionScopeKey?: string
}) {
  const [local, setLocal] = useState(() => ({
    currentUserId,
    origin: {},
    scope: selectionScopeKey,
    state: createIncrementalSelection(),
  }))
  const current =
    local.scope === selectionScopeKey && local.currentUserId === currentUserId
      ? local
      : {
          currentUserId,
          origin: {},
          scope: selectionScopeKey,
          state: createIncrementalSelection(),
        }

  if (current !== local) {
    setLocal(current)
  }

  const { origin, state } = current
  const update = useCallback(
    ({ transform }: { transform: (previous: IncrementalSelection) => IncrementalSelection }) => {
      setLocal((previous) => {
        if (previous.origin !== origin) {
          return previous
        }

        const next = transform(previous.state)

        return next === previous.state ? previous : { ...previous, state: next }
      })
    },
    [origin],
  )
  const registerVisibleDocuments = useCallback(
    ({ documents }: { documents: SelectionDocument[] }) => {
      update({
        transform: (state) => registerSelectionDocuments({ currentUserId, documents, state }),
      })
    },
    [currentUserId, update],
  )
  const toggleSelection = useCallback(
    (args: Omit<Parameters<typeof toggleIncrementalDocument>[0], 'currentUserId' | 'state'>) => {
      update({ transform: (state) => toggleIncrementalDocument({ ...args, currentUserId, state }) })
    },
    [currentUserId, update],
  )
  const toggleAllInCollection = useCallback(
    ({ collectionSlug }: { collectionSlug: string }) => {
      update({
        transform: (state) => toggleVisibleSelection({ collectionSlug, currentUserId, state }),
      })
    },
    [currentUserId, update],
  )
  const clearCollection = useCallback(
    ({ collectionSlug }: { collectionSlug: string }) => {
      update({
        transform: (state) => ({
          ...state,
          selections: Object.fromEntries(
            Object.entries(state.selections).filter(([slug]) => slug !== collectionSlug),
          ),
        }),
      })
    },
    [update],
  )
  const clearAll = useCallback(() => {
    update({ transform: (state) => ({ ...state, selections: {} }) })
  }, [update])

  return {
    clearAll,
    clearCollection,
    registerVisibleDocuments,
    state,
    toggleAllInCollection,
    toggleSelection,
  }
}
