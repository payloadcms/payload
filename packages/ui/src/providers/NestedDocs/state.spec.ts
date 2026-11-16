import type { Column, NestedDocRow, PaginatedDocs } from 'payload'

import { describe, expect, it } from 'vitest'

import { appendTreePage, branchKey, createTreeCache, flattenTreeCache } from './state.js'

const page = ({
  docs,
  hasNextPage = false,
  pageNumber = 1,
}: {
  docs: PaginatedDocs['docs']
  hasNextPage?: boolean
  pageNumber?: number
}) =>
  ({
    docs,
    hasNextPage,
    limit: 1,
    page: pageNumber,
    totalDocs: docs.length,
    totalPages: 1,
  }) as PaginatedDocs
const row = (overrides: Partial<NestedDocRow> = {}): NestedDocRow => ({
  depth: 0,
  hasChildren: false,
  hasMore: false,
  isExpanded: false,
  limit: 1,
  parentID: null,
  ...overrides,
})
const columns = ({ cells }: { cells: string[] }) =>
  [{ accessor: 'title', active: true, renderedCells: cells }] as Column[]

describe('nested document branch cache', () => {
  it('should append new sibling cells without replacing earlier custom cells or moving the next root', () => {
    const initial = createTreeCache({
      columns: columns({ cells: ['About cell', 'Team custom cell', 'Contact cell'] }),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }, { id: 'z' }] }),
      pageSize: 1,
      rows: {
        a: row({ hasChildren: true, hasMore: true, isExpanded: true }),
        b: row({ depth: 1, parentID: 'a' }),
        z: row(),
      },
    })
    const cache = appendTreePage({
      cache: initial,
      columns: columns({ cells: ['Careers custom cell'] }),
      data: page({ docs: [{ id: 'c' }] }),
      page: 2,
      parentID: 'a',
      rows: { c: row() },
    })
    const visible = flattenTreeCache({ cache, pageSize: 1 })

    expect(visible.docs.map((doc) => doc.id)).toEqual(['a', 'b', 'c', 'z'])
    expect(visible.columns[0].renderedCells).toEqual([
      'About cell',
      'Team custom cell',
      'Careers custom cell',
      'Contact cell',
    ])
    expect(visible.rows.b.isLastSibling).toBe(false)
    expect(visible.rows.c.isLastSibling).toBe(true)
    expect(cache.branches.get(branchKey({ parentID: 'a' })).page).toBe(2)
  })

  it('should retain cached descendants when collapsed and reopen them without fetching', () => {
    const cache = createTreeCache({
      columns: columns({ cells: ['A', 'B'] }),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }] }),
      pageSize: 1,
      rows: {
        a: row({ hasChildren: true, isExpanded: true }),
        b: row({ depth: 1, parentID: 'a' }),
      },
    })
    const collapsed = { ...cache, expanded: new Set<string>() }

    expect(flattenTreeCache({ cache: collapsed, pageSize: 1 }).docs.map((doc) => doc.id)).toEqual([
      'a',
    ])
    expect(
      flattenTreeCache({ cache: { ...collapsed, expanded: new Set(['a']) }, pageSize: 1 }).docs.map(
        (doc) => doc.id,
      ),
    ).toEqual(['a', 'b'])
  })

  it('should continue ancestor guides across a grandchild and terminate the last sibling', () => {
    const cache = createTreeCache({
      columns: columns({ cells: ['A', 'B', 'C', 'D'] }),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] }),
      pageSize: 10,
      rows: {
        a: row({ hasChildren: true, isExpanded: true }),
        b: row({ hasChildren: true, isExpanded: true, parentID: 'a' }),
        c: row({ parentID: 'b' }),
        d: row({ parentID: 'a' }),
      },
    })
    const visible = flattenTreeCache({ cache, pageSize: 10 })

    expect(visible.rows.c.ancestorContinues).toEqual([true])
    expect(visible.rows.c.depth).toBe(2)
    expect(visible.rows.d.isLastSibling).toBe(true)
  })

  it('should continue after the server page when initialized beyond the first root page', () => {
    const cache = createTreeCache({
      columns: columns({ cells: ['Page three cell'] }),
      data: page({ docs: [{ id: 'third-page-root' }], hasNextPage: true, pageNumber: 3 }),
      pageSize: 1,
      rows: { 'third-page-root': row() },
    })

    expect(cache.branches.get(branchKey({ parentID: null }))?.page).toBe(3)
    expect(
      flattenTreeCache({ cache, pageSize: 1 }).continuationsByRowID.get('third-page-root'),
    ).toEqual([null])
  })

  it('should deduplicate overlapping pages while keeping cells aligned with each document', () => {
    const initial = createTreeCache({
      columns: columns({ cells: ['A cell', 'B original cell'] }),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }], hasNextPage: true }),
      pageSize: 2,
      rows: { a: row(), b: row() },
    })
    const next = appendTreePage({
      cache: initial,
      columns: columns({ cells: ['B refreshed cell', 'C cell'] }),
      data: page({ docs: [{ id: 'b' }, { id: 'c' }] }),
      page: 2,
      parentID: null,
      rows: { b: row(), c: row() },
    })
    const visible = flattenTreeCache({ cache: next, pageSize: 2 })

    expect(visible.docs.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
    expect(visible.columns[0].renderedCells).toEqual(['A cell', 'B refreshed cell', 'C cell'])
    expect(initial.branches.get(branchKey({ parentID: null }))?.ids).toEqual(['a', 'b'])
  })

  it('should retain a numeric zero parent separately from the root branch', () => {
    const cache = createTreeCache({
      columns: columns({ cells: ['Zero cell', 'Child cell'] }),
      data: page({ docs: [{ id: 0 }, { id: 1 }] }),
      pageSize: 1,
      rows: {
        '0': row({ hasChildren: true, isExpanded: true }),
        '1': row({ parentID: 0 }),
      },
    })
    const visible = flattenTreeCache({ cache, pageSize: 1 })

    expect(visible.docs.map(({ id }) => id)).toEqual([0, 1])
    expect(visible.rows['1'].parentID).toBe(0)
    expect(visible.rows['1'].depth).toBe(1)
  })

  it('should stop a circular branch without hiding an unrelated root', () => {
    let cache = createTreeCache({
      columns: columns({ cells: ['A cell', 'Z cell'] }),
      data: page({ docs: [{ id: 'a' }, { id: 'z' }] }),
      pageSize: 2,
      rows: { a: row({ hasChildren: true, isExpanded: true }), z: row() },
    })
    cache = appendTreePage({
      cache,
      columns: columns({ cells: ['B cell'] }),
      data: page({ docs: [{ id: 'b' }] }),
      page: 1,
      parentID: 'a',
      rows: { b: row({ hasChildren: true }) },
    })
    cache = appendTreePage({
      cache,
      columns: columns({ cells: ['A cell'] }),
      data: page({ docs: [{ id: 'a' }] }),
      page: 1,
      parentID: 'b',
      rows: { a: row({ hasChildren: true }) },
    })
    cache = { ...cache, expanded: new Set(['a', 'b']) }

    expect(flattenTreeCache({ cache, pageSize: 2 }).docs.map(({ id }) => id)).toEqual([
      'a',
      'b',
      'z',
    ])
  })

  it('should turn an authoritative empty first child page into a leaf', () => {
    const initial = createTreeCache({
      columns: columns({ cells: ['A cell'] }),
      data: page({ docs: [{ id: 'a' }] }),
      pageSize: 1,
      rows: { a: row({ hasChildren: true }) },
    })
    const next = appendTreePage({
      cache: initial,
      columns: columns({ cells: [] }),
      data: page({ docs: [] }),
      page: 1,
      parentID: 'a',
      rows: {},
    })

    expect(next.nodes.get('a')?.row.hasChildren).toBe(false)
    expect(initial.nodes.get('a')?.row.hasChildren).toBe(true)
    expect(next.branches.get(branchKey({ parentID: 'a' }))?.hasMore).toBe(false)
  })
})
