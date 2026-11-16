import type { HierarchyContents } from 'payload'

import { expect, test, vi } from 'vitest'

import type { HierarchyContentsTreeState } from './state.js'

import { getVisibleDocuments } from './getVisibleDocuments.js'

vi.mock('./useHierarchyContentsTree.js', () => ({
  allSourcesKey: '*',
  branchKey: ({ id }: { id: unknown }) => JSON.stringify(id),
}))

const source = ({
  collectionSlug,
  docs,
}: {
  collectionSlug: string
  docs: HierarchyContents['sources'][number]['docs']
}) => ({ collectionSlug, docs, hasNextPage: false, page: 1, totalDocs: docs.length, totalPages: 1 })
const branch = ({ sources }: { sources: HierarchyContents['sources'] }) => ({
  errors: [],
  pending: [],
  sources,
})
const branches: HierarchyContentsTreeState['branches'] = {
  '1': branch({
    sources: [
      source({ collectionSlug: 'containers', docs: [{ id: 3 }] }),
      source({ collectionSlug: 'articles', docs: [{ id: 4 }, { id: 5 }] }),
    ],
  }),
  '3': branch({ sources: [source({ collectionSlug: 'assets', docs: [{ id: 6 }] })] }),
  null: branch({
    sources: [
      source({
        collectionSlug: 'containers',
        docs: [
          { id: 1, allowedTypes: ['articles'] },
          { id: 2, allowedTypes: ['assets'] },
        ],
      }),
      source({ collectionSlug: 'articles', docs: [{ id: 1 }] }),
    ],
  }),
}
const collect = ({
  data = branches,
  expanded = [],
  groups = true,
  selectedTypes = ['articles', 'assets'],
}: {
  data?: typeof branches
  expanded?: number[]
  groups?: boolean
  selectedTypes?: string[]
} = {}) =>
  getVisibleDocuments({
    branches: data,
    collectionSlug: 'containers',
    collectionSpecificFieldName: 'allowedTypes',
    expanded: new Set(expanded.map((id) => JSON.stringify(id))),
    isGroupExpanded: () => groups,
    parentID: null,
    selectedTypes,
  })

test('should register only loaded visible rows from expanded branches and source groups', () => {
  const documents = collect({ expanded: [1], groups: false })

  expect(documents.map(({ collectionSlug, document }) => [collectionSlug, document.id])).toEqual([
    ['containers', 1],
    ['containers', 3],
    ['containers', 2],
  ])
})

test('should retain source identities when document IDs overlap', () => {
  const documents = collect()

  expect(documents.map(({ collectionSlug, document }) => [collectionSlug, document.id])).toEqual([
    ['containers', 1],
    ['containers', 2],
    ['articles', 1],
  ])
})

test('should register each container’s own allowed types and leave unavailable metadata absent', () => {
  const documents = collect({ expanded: [1] })

  expect(
    documents.find(
      ({ collectionSlug, document }) => document.id === 1 && collectionSlug === 'containers',
    )?.metadata,
  ).toEqual({ allowedCollections: ['articles'] })
  expect(documents.find(({ document }) => document.id === 2)?.metadata).toEqual({
    allowedCollections: ['assets'],
  })
  expect(documents.find(({ document }) => document.id === 3)).not.toHaveProperty('metadata')
})

test('should filter complete source groups without hiding navigable container rows', () => {
  const documents = collect({ expanded: [1, 3], selectedTypes: ['assets'] })

  expect(documents.map(({ collectionSlug }) => collectionSlug)).toEqual([
    'containers',
    'containers',
    'assets',
    'containers',
  ])
})

test('should omit rows hidden by an aggregate loading or failure state', () => {
  const data = { ...branches, '1': { ...branches['1'], pending: ['*'] } }

  expect(collect({ data, expanded: [1] }).map(({ document }) => document.id)).toEqual([1, 2, 1])
})

test('should normalize numeric editor IDs while preserving document ID zero', () => {
  const data = {
    null: branch({
      sources: [
        source({
          collectionSlug: 'containers',
          docs: [{ id: 0, _isLocked: true, _userEditing: { id: 0 } }],
        }),
      ],
    }),
  }
  const documents = collect({ data })

  expect(documents[0].document).toEqual({ id: 0, _isLocked: true, _userEditing: { id: '0' } })
})

test('should deduplicate a document visible in multiple container branches', () => {
  const data = {
    ...branches,
    '2': branch({ sources: [source({ collectionSlug: 'articles', docs: [{ id: 4 }] })] }),
  }
  const documents = collect({ data, expanded: [1, 2] })

  expect(
    documents.filter(
      ({ collectionSlug, document }) => collectionSlug === 'articles' && document.id === 4,
    ),
  ).toHaveLength(1)
})

test('should stop descending when a loaded hierarchy contains a cycle', () => {
  const data = {
    ...branches,
    '3': branch({ sources: [source({ collectionSlug: 'containers', docs: [{ id: 1 }] })] }),
  }

  expect(collect({ data, expanded: [1, 3] }).map(({ document }) => document.id)).toEqual([
    1, 3, 4, 5, 2, 1,
  ])
})
