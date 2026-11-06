import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { renderCollectionPreviewTable } from './renderTable.js'

vi.mock('payload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload')>()),
  createClientCollectionConfig: ({ collection }: { collection: unknown }) => collection,
}))

vi.mock('../../exports/client/index.js', () => ({
  DefaultCell: 'span',
  FolderIcon: 'svg',
  RenderDefaultCell: 'span',
  SortColumn: 'span',
  Table: 'table',
  TagIcon: 'svg',
}))

describe('collection preview table', () => {
  it('should use configured column order and omit fields without read permission', () => {
    const collection = {
      slug: 'pages',
      admin: { defaultColumns: ['summary', 'title', 'secret'], useAsTitle: 'title' },
      fields: ['title', 'summary', 'secret'].map((name) => ({
        name,
        type: 'text',
        label: name,
        admin: {},
      })),
    } as unknown as SanitizedCollectionConfig
    const req = {
      i18n: { language: 'en', t: (key: string) => key },
      payload: {
        collections: { pages: { config: collection } },
        config: { db: { defaultIDType: 'text' }, routes: { admin: '/admin' } },
        importMap: {},
      },
    } as unknown as PayloadRequest
    const docs = [{ id: '1', summary: 'Summary', title: 'Title', secret: 'Private' }]

    const table = renderCollectionPreviewTable({
      collection,
      docs,
      fieldPermissions: { summary: { read: true }, title: { read: true }, secret: { read: false } },
      label: 'Pages',
      req,
    })

    expect(table.props.columns.map(({ accessor }) => accessor)).toEqual(['summary', 'title'])
    expect(table.props.columns.map(({ Heading }) => Heading)).toEqual(['summary', 'title'])
    expect(table.props.columns[0].renderedCells).toHaveLength(1)
    expect(table.props.columns[0].isLinkedColumn).toBe(true)
    expect(table.props['ariaLabel']).toBe('Pages')
    expect(table.props.shouldScopeHeadingIDs).toBe(true)
    expect(table.props.data).toBe(docs)
  })
})
