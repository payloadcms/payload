import type { SelectionDocument, SelectionState } from './types.js'

import { SelectAllStatus } from '../Selection/index.js'

export type IncrementalSelection = {
  known: Map<string, SelectionDocument>
  selections: SelectionState
  visible: SelectionDocument[]
}

export const createIncrementalSelection = (): IncrementalSelection => ({
  known: new Map(),
  selections: {},
  visible: [],
})

export function registerSelectionDocuments({
  currentUserId,
  documents,
  state,
}: {
  currentUserId?: string
  documents: SelectionDocument[]
  state: IncrementalSelection
}): IncrementalSelection {
  const known = new Map(state.known)
  const selections = { ...state.selections }
  const updatedCollections = new Set<string>()
  const unique = [...new Map(documents.map((entry) => [documentKey(entry), entry])).values()]
  const visible = unique.length === documents.length ? documents : unique

  for (const entry of visible) {
    known.set(documentKey(entry), entry)

    const selected = selections[entry.collectionSlug]?.selected

    if (selected?.has(entry.document.id)) {
      if (!updatedCollections.has(entry.collectionSlug)) {
        selections[entry.collectionSlug] = {
          selectAllStatus: SelectAllStatus.None,
          selected: new Map(selected),
        }
        updatedCollections.add(entry.collectionSlug)
      }
      const next = selections[entry.collectionSlug].selected

      if (isSelectionDocumentLocked({ currentUserId, entry })) {
        next.delete(entry.document.id)
      } else {
        next.set(entry.document.id, entry.metadata ?? {})
      }
    }
  }

  return withVisibleStatus({ currentUserId, state: { known, selections, visible } })
}

export function toggleVisibleSelection({
  collectionSlug,
  currentUserId,
  state,
}: {
  collectionSlug: string
  currentUserId?: string
  state: IncrementalSelection
}): IncrementalSelection {
  const selected = new Map(state.selections[collectionSlug]?.selected)
  const documents = selectableVisibleDocuments({ collectionSlug, currentUserId, state })
  const shouldDeselect =
    documents.length > 0 && documents.every(({ document }) => selected.has(document.id))

  for (const entry of documents) {
    if (shouldDeselect) {
      selected.delete(entry.document.id)
    } else {
      selected.set(entry.document.id, entry.metadata ?? {})
    }
  }

  return withVisibleStatus({
    currentUserId,
    state: {
      ...state,
      selections: {
        ...state.selections,
        [collectionSlug]: { selectAllStatus: SelectAllStatus.None, selected },
      },
    },
  })
}

export function toggleIncrementalDocument({
  id,
  collectionSlug,
  currentUserId,
  state,
}: {
  collectionSlug: string
  currentUserId?: string
  id: number | string
  metadata?: SelectionDocument['metadata']
  state: IncrementalSelection
}): IncrementalSelection {
  const entry = state.known.get(documentKey({ collectionSlug, document: { id } }))
  const selected = new Map(state.selections[collectionSlug]?.selected)

  if (!entry || isSelectionDocumentLocked({ currentUserId, entry })) {
    return state
  }
  if (selected.has(id)) {
    selected.delete(id)
  } else {
    if (!state.visible.some((item) => documentKey(item) === documentKey(entry))) {
      return state
    }
    selected.set(id, entry.metadata ?? {})
  }

  return withVisibleStatus({
    currentUserId,
    state: {
      ...state,
      selections: {
        ...state.selections,
        [collectionSlug]: { selectAllStatus: SelectAllStatus.None, selected },
      },
    },
  })
}

export function getVisibleSelectionStatus({
  collectionSlug,
  currentUserId,
  state,
}: {
  collectionSlug: string
  currentUserId?: string
  state: IncrementalSelection
}): SelectAllStatus {
  const visible = selectableVisibleDocuments({ collectionSlug, currentUserId, state })
  const selected = state.selections[collectionSlug]?.selected
  const count = visible.filter(({ document }) => selected?.has(document.id)).length

  return count === 0
    ? SelectAllStatus.None
    : count === visible.length
      ? SelectAllStatus.AllInPage
      : SelectAllStatus.Some
}

export const isSelectionDocumentLocked = ({
  currentUserId,
  entry,
}: {
  currentUserId?: string
  entry: SelectionDocument
}): boolean => {
  const ownerID = entry.document._userEditing?.id

  return Boolean(
    entry.document._isLocked &&
    (ownerID === undefined || currentUserId === undefined || String(ownerID) !== currentUserId),
  )
}

const documentKey = ({ collectionSlug, document }: SelectionDocument): string =>
  JSON.stringify([collectionSlug, document.id])

const selectableVisibleDocuments = ({
  collectionSlug,
  currentUserId,
  state,
}: {
  collectionSlug: string
  currentUserId?: string
  state: IncrementalSelection
}) =>
  state.visible.filter(
    (entry) =>
      entry.collectionSlug === collectionSlug &&
      !isSelectionDocumentLocked({ currentUserId, entry }),
  )

const withVisibleStatus = ({
  currentUserId,
  state,
}: {
  currentUserId?: string
  state: IncrementalSelection
}): IncrementalSelection => {
  const selections = { ...state.selections }
  const slugs = new Set([
    ...Object.keys(selections),
    ...state.visible.map((entry) => entry.collectionSlug),
  ])

  for (const collectionSlug of slugs) {
    selections[collectionSlug] = {
      selectAllStatus: getVisibleSelectionStatus({ collectionSlug, currentUserId, state }),
      selected: selections[collectionSlug]?.selected ?? new Map(),
    }
  }

  return { ...state, selections }
}
