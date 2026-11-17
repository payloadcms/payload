import { expect, test, vi } from 'vitest'

import type { SelectionDocument } from './types.js'

import { SelectAllStatus } from '../Selection/index.js'
import {
  createIncrementalSelection,
  getVisibleSelectionStatus,
  isSelectionDocumentLocked,
  registerSelectionDocuments,
  toggleIncrementalDocument,
  toggleVisibleSelection,
} from './incremental.js'

vi.mock('../Selection/index.js', () => ({
  SelectAllStatus: { AllInPage: 'allInPage', None: 'none', Some: 'some' },
}))

const first: SelectionDocument = {
  collectionSlug: 'pages',
  document: { id: 1 },
  metadata: { allowedCollections: ['posts'] },
}
const second: SelectionDocument = {
  collectionSlug: 'pages',
  document: { id: 2 },
  metadata: { allowedCollections: ['assets'] },
}

const registered = ({
  currentUserId,
  documents = [first, second],
}: { currentUserId?: string; documents?: SelectionDocument[] } = {}) =>
  registerSelectionDocuments({ currentUserId, documents, state: createIncrementalSelection() })

test('should select only registered visible records and preserve per-document metadata', () => {
  const state = toggleVisibleSelection({ collectionSlug: 'pages', state: registered() })

  expect([...state.selections.pages.selected]).toEqual([
    [1, first.metadata],
    [2, second.metadata],
  ])
  expect(state.selections.pages.selectAllStatus).toBe(SelectAllStatus.AllInPage)
})

test('should preserve hidden explicit selections when selecting and deselecting visible rows', () => {
  let state = toggleIncrementalDocument({ id: 1, collectionSlug: 'pages', state: registered() })
  state = registerSelectionDocuments({ documents: [second], state })

  expect(getVisibleSelectionStatus({ collectionSlug: 'pages', state })).toBe(SelectAllStatus.None)
  state = toggleVisibleSelection({ collectionSlug: 'pages', state })
  expect([...state.selections.pages.selected.keys()]).toEqual([1, 2])
  expect(state.selections.pages.selectAllStatus).toBe(SelectAllStatus.AllInPage)
  state = toggleVisibleSelection({ collectionSlug: 'pages', state })
  expect([...state.selections.pages.selected.keys()]).toEqual([1])
  expect(state.selections.pages.selectAllStatus).toBe(SelectAllStatus.None)
})

test('should not select cached hidden or never loaded records', () => {
  const state = registerSelectionDocuments({ documents: [], state: registered() })

  expect(toggleIncrementalDocument({ id: 1, collectionSlug: 'pages', state })).toBe(state)
  expect(toggleIncrementalDocument({ id: 999, collectionSlug: 'pages', state })).toBe(state)
  expect(
    toggleVisibleSelection({ collectionSlug: 'pages', state }).selections.pages.selected.size,
  ).toBe(0)
})

test('should keep identical IDs in different collections separate', () => {
  const other = { ...first, collectionSlug: 'posts' }
  let state = registered({ documents: [first, other] })
  state = toggleVisibleSelection({ collectionSlug: 'pages', state })

  expect(state.selections.pages.selected.has(1)).toBe(true)
  expect(state.selections.posts.selected.size).toBe(0)
  state = toggleVisibleSelection({ collectionSlug: 'posts', state })
  expect(state.selections.posts.selected.has(1)).toBe(true)
})

test('should exclude records locked by others while allowing the current editor', () => {
  const documents = [
    { ...first, document: { id: 1, _isLocked: true, _userEditing: { id: 'other' } } },
    { ...second, document: { id: 2, _isLocked: true, _userEditing: { id: 'me' } } },
  ]
  const state = toggleVisibleSelection({
    collectionSlug: 'pages',
    currentUserId: 'me',
    state: registered({ currentUserId: 'me', documents }),
  })

  expect([...state.selections.pages.selected.keys()]).toEqual([2])
  expect(state.selections.pages.selectAllStatus).toBe(SelectAllStatus.AllInPage)
})

test('should prune an explicitly selected record when a refreshed read reports another editor', () => {
  let state = toggleIncrementalDocument({ id: 1, collectionSlug: 'pages', state: registered() })
  state = registerSelectionDocuments({
    documents: [{ ...first, document: { id: 1, _isLocked: true, _userEditing: { id: 'other' } } }],
    state,
  })

  expect(state.selections.pages.selected.size).toBe(0)
})

test('should immutably refresh several selected records and prune new locks in one registration', () => {
  const third: SelectionDocument = { collectionSlug: 'pages', document: { id: 3 } }
  const original = toggleVisibleSelection({
    collectionSlug: 'pages',
    state: registered({ documents: [first, second, third] }),
  })
  const refreshed = registerSelectionDocuments({
    documents: [
      { ...first, metadata: { allowedCollections: ['articles'] } },
      { ...second, metadata: { allowedCollections: ['media'] } },
      { ...third, document: { id: 3, _isLocked: true } },
    ],
    state: original,
  })

  expect([...refreshed.selections.pages.selected]).toEqual([
    [1, { allowedCollections: ['articles'] }],
    [2, { allowedCollections: ['media'] }],
  ])
  expect(refreshed.selections.pages.selectAllStatus).toBe(SelectAllStatus.AllInPage)
  expect([...original.selections.pages.selected]).toEqual([
    [1, first.metadata],
    [2, second.metadata],
    [3, {}],
  ])
  expect(original.known.get(JSON.stringify(['pages', 3]))).toEqual(third)
})

test('should use a selected document’s own metadata for single selection', () => {
  const state = toggleIncrementalDocument({ id: 2, collectionSlug: 'pages', state: registered() })

  expect(state.selections.pages.selected.get(2)).toEqual(second.metadata)
  expect(state.selections.pages.selectAllStatus).toBe(SelectAllStatus.Some)
})

test('should remove stale selected metadata when an authorized refreshed row omits it', () => {
  let state = toggleIncrementalDocument({ id: 1, collectionSlug: 'pages', state: registered() })
  state = registerSelectionDocuments({
    documents: [{ collectionSlug: 'pages', document: { id: 1 } }],
    state,
  })

  expect(state.selections.pages.selected.get(1)).toEqual({})
})

test('should count duplicated visible records only once', () => {
  let state = registered({ documents: [first, first, second] })
  state = toggleIncrementalDocument({ id: 1, collectionSlug: 'pages', state })

  expect(state.visible.length).toBe(2)
  expect(state.selections.pages.selectAllStatus).toBe(SelectAllStatus.Some)
})

test('should retain hidden metadata when an entire source group is collapsed', () => {
  let state = toggleVisibleSelection({ collectionSlug: 'pages', state: registered() })
  state = registerSelectionDocuments({ documents: [], state })

  expect(state.selections.pages.selected.get(1)).toEqual(first.metadata)
  expect(state.selections.pages.selected.get(2)).toEqual(second.metadata)
  expect(getVisibleSelectionStatus({ collectionSlug: 'pages', state })).toBe(SelectAllStatus.None)
})

test('should re-evaluate lock ownership when the user changes with the same visible snapshot', () => {
  const documents = [{ ...first, document: { id: 1, _isLocked: true, _userEditing: { id: 'me' } } }]
  let state = registered({ currentUserId: 'me', documents })
  state = toggleIncrementalDocument({ id: 1, collectionSlug: 'pages', currentUserId: 'me', state })
  state = registerSelectionDocuments({ currentUserId: 'someone-else', documents, state })

  expect(state.selections.pages.selected.size).toBe(0)
})

test('should keep registered row metadata authoritative over a caller’s parent hint', () => {
  const state = toggleIncrementalDocument({
    id: 2,
    collectionSlug: 'pages',
    metadata: first.metadata,
    state: registered(),
  })

  expect(state.selections.pages.selected.get(2)).toEqual(second.metadata)
})

test('should not restore caller metadata when the registered field is unavailable', () => {
  const state = toggleIncrementalDocument({
    id: 1,
    collectionSlug: 'pages',
    metadata: first.metadata,
    state: registered({ documents: [{ collectionSlug: 'pages', document: { id: 1 } }] }),
  })

  expect(state.selections.pages.selected.get(1)).toEqual({})
})

test('should exclude ownerless locks even if a user ID resembles a missing value', () => {
  expect(
    isSelectionDocumentLocked({
      currentUserId: 'undefined',
      entry: { ...first, document: { id: 1, _isLocked: true } },
    }),
  ).toBe(true)
  expect(
    isSelectionDocumentLocked({
      currentUserId: '0',
      entry: { ...first, document: { id: 1, _isLocked: true, _userEditing: { id: '0' } } },
    }),
  ).toBe(false)
})
