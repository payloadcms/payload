import type { Column, NestedDocRow, PaginatedDocs } from 'payload'

import { describe, expect, it } from 'vitest'

import { appendTreePage, branchKey, createTreeCache, flattenTreeCache } from './state.js'

const page = ({
  docs,
  hasNextPage = false,
}: {
  docs: PaginatedDocs['docs']
  hasNextPage?: boolean
}) =>
  ({ docs, hasNextPage, limit: 1, page: 1, totalDocs: docs.length, totalPages: 1 }) as PaginatedDocs
const row = (overrides: Partial<NestedDocRow> = {}): NestedDocRow => ({
  depth: 0,
  hasChildren: false,
  hasMore: false,
  isExpanded: false,
  limit: 1,
  parentID: null,
  ...overrides,
})
const columns = (cells: string[]) =>
  [{ accessor: 'title', active: true, renderedCells: cells }] as Column[]

describe('nested document branch cache', () => {
  it('should append new sibling cells without replacing earlier custom cells or moving the next root', () => {
    const initial = createTreeCache({
      columns: columns(['About cell', 'Team custom cell', 'Contact cell']),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }, { id: 'z' }] }),
      pageSize: 1,
      rows: {
        a: row({ hasChildren: true, isExpanded: true, hasMore: true }),
        b: row({ parentID: 'a', depth: 1 }),
        z: row(),
      },
    })
    const cache = appendTreePage({
      cache: initial,
      parentID: 'a',
      page: 2,
      columns: columns(['Careers custom cell']),
      data: page({ docs: [{ id: 'c' }] }),
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
    expect(cache.branches.get(branchKey('a')).page).toBe(2)
  })

  it('should retain cached descendants when collapsed and reopen them without fetching', () => {
    const cache = createTreeCache({
      columns: columns(['A', 'B']),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }] }),
      pageSize: 1,
      rows: {
        a: row({ hasChildren: true, isExpanded: true }),
        b: row({ parentID: 'a', depth: 1 }),
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
      columns: columns(['A', 'B', 'C', 'D']),
      data: page({ docs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] }),
      pageSize: 10,
      rows: {
        a: row({ hasChildren: true, isExpanded: true }),
        b: row({ parentID: 'a', hasChildren: true, isExpanded: true }),
        c: row({ parentID: 'b' }),
        d: row({ parentID: 'a' }),
      },
    })
    const visible = flattenTreeCache({ cache, pageSize: 10 })

    expect(visible.rows.c.ancestorContinues).toEqual([true])
    expect(visible.rows.c.depth).toBe(2)
    expect(visible.rows.d.isLastSibling).toBe(true)
  })
})
