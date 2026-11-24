import type { Column, NestedDocRow } from 'payload'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'

import type { useNestedDocsTree } from '../../providers/NestedDocs/index.js'

const state = vi.hoisted(() => ({
  selected: new Map<number | string, boolean>(),
  tree: null as ReturnType<typeof useNestedDocsTree>,
}))

vi.mock('../../providers/Auth/index.js', () => ({ useAuth: () => ({ user: { id: 1 } }) }))
vi.mock('../../providers/Selection/index.js', () => ({
  useSelection: () => ({ selected: state.selected, setSelection: vi.fn() }),
}))
vi.mock('../../providers/NestedDocs/index.js', () => ({ useNestedDocsTree: () => state.tree }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string, args?: { label?: string }) => (args?.label ? `${key}: ${args.label}` : key),
  }),
}))

import { Table } from './index.js'

const documents = [
  { id: 0, title: 'Parent' },
  { id: 2, title: 'Child' },
]
const columns: Column[] = [
  {
    field: { name: 'title', type: 'text' },
    accessor: 'title',
    active: true,
    Heading: 'Title',
    isLinkedColumn: true,
    renderedCells: documents.map((doc) =>
      React.createElement('a', { href: `/custom/${doc.id}` }, `Custom ${doc.title}`),
    ),
  },
]
const rows: Record<string, NestedDocRow> = {
  '0': {
    depth: 0,
    hasChildren: true,
    hasMore: false,
    isExpanded: true,
    isLastSibling: true,
    limit: 10,
    parentID: null,
  },
  '2': {
    depth: 1,
    hasChildren: false,
    hasMore: false,
    isExpanded: false,
    isLastSibling: true,
    limit: 10,
    parentID: 0,
  },
}

beforeEach(() => {
  state.selected = new Map()
  state.tree = null
})

test('should preserve ordinary custom cells without adding hierarchy controls', () => {
  const html = renderToStaticMarkup(React.createElement(Table, { columns, data: documents }))

  expect(html).toContain('<a href="/custom/0">Custom Parent</a>')
  expect(html).not.toContain('tree-item')
  expect(html).not.toContain('role="grid"')
})

test('should preserve grid selection semantics for unlocked and locked rows', () => {
  state.selected.set(0, true)
  state.selected.set(2, true)
  const select: Column = {
    field: { name: '_select', type: 'ui' },
    accessor: '_select',
    active: true,
    Heading: 'Select',
    renderedCells: ['Select parent', 'Select child'],
  }
  const html = renderToStaticMarkup(
    React.createElement(Table, {
      columns: [select, ...columns],
      data: [documents[0], { ...documents[1], _isLocked: true, _userEditing: { id: 3 } }],
      navigationLabel: 'Documents',
    }),
  )

  expect(html).toContain('aria-multiselectable="true"')
  expect(html).toMatch(/<tr aria-label="1" aria-selected="true"[^>]*role="row"/)
  expect(html).toMatch(/<tr aria-label="2" class="row-2"[^>]*role="row"/)
  expect(html).toContain('role="gridcell"')
})

test('should retain custom nested cells and parent descriptions for numeric zero parents', () => {
  const html = renderToStaticMarkup(
    React.createElement(Table, {
      columns,
      data: documents,
      nestedDocRows: rows,
      useAsTitle: 'title',
    }),
  )

  expect(html).toContain('general:parentDocument: Parent. ')
  expect(html).toContain('<a href="/custom/2">Custom Child</a>')
  expect(html).toContain('aria-label="general:collapse: Parent"')
  expect(html).toContain('aria-expanded="true"')
})

test('should render branch continuations immediately after their final document', () => {
  state.tree = {
    columns,
    continuationsByRowID: new Map([['2', [0, null]]]),
    docs: documents,
    errors: new Set(),
    loadMore: vi.fn(),
    pending: new Set(),
    rows,
    toggle: vi.fn(),
  }
  const html = renderToStaticMarkup(
    React.createElement(Table, {
      ariaLabel: 'Pages',
      columns,
      data: [],
      nestedDocRows: {},
      useAsTitle: 'title',
    }),
  )

  expect(html).toContain('aria-label="general:loadMore: Parent"')
  expect(html).toContain('aria-label="general:loadMore: Pages"')
  expect(html.indexOf('Custom Child')).toBeLessThan(html.indexOf('nested-docs-continuation-row'))
  expect(html.match(/class="nested-docs-continuation-row"/g)).toHaveLength(2)
})
