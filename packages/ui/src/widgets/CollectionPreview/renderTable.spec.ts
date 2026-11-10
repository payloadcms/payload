import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { renderCollectionPreviewTable } from './renderTable.js'

vi.mock('payload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload')>()),
  createClientCollectionConfig: ({ collection }: { collection: unknown }) => collection,
}))

vi.mock('../../exports/client/index.js', () => ({
  DefaultCell: 'span',
  DocumentIcon: 'svg',
  FolderIcon: 'svg',
  Link: 'a',
  RenderDefaultCell: 'span',
  SortColumn: 'span',
  Table: 'table',
  TagIcon: 'svg',
  Thumbnail: 'img',
}))

describe('collection preview table', () => {
  it('should use fixed summary columns instead of configured collection columns', () => {
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
      thumbnailURLs: new Map(),
    })

    expect(table.props.columns.map(({ accessor }) => accessor)).toEqual([
      'title',
      'updatedAt',
      'updatedBy',
      'createdBy',
    ])
    expect(table.props.columns.map(({ Heading }) => Heading)).toEqual([
      'dashboard:widgetTitleLabel',
      'general:updatedAt',
      'general:updatedBy',
      'general:createdBy',
    ])
    expect(table.props.columns[0].renderedCells).toHaveLength(1)
    expect(table.props.columns[0].isLinkedColumn).toBe(true)
    expect(table.props['ariaLabel']).toBe('Pages')
    expect(table.props.shouldScopeHeadingIDs).toBe(true)
    expect(table.props.data).toBe(docs)
    expect(
      table.props.columns.slice(1).every(({ renderedCells }) => renderedCells[0] === null),
    ).toBe(true)
  })

  it.each([false, true])(
    'should show resolved thumbnails and placeholders when upload is %s',
    (isUploadEnabled) => {
      const titleField = isUploadEnabled ? 'filename' : 'title'
      const collection = {
        slug: 'documents',
        admin: { defaultColumns: [titleField], useAsTitle: titleField },
        fields: [{ name: titleField, type: 'text', label: 'Title', admin: {} }],
        upload: isUploadEnabled ? {} : false,
      } as unknown as SanitizedCollectionConfig
      const req = {
        i18n: { language: 'en', t: (key: string) => key },
        payload: {
          collections: { documents: { config: collection } },
          config: { db: { defaultIDType: 'text' }, routes: { admin: '/admin' } },
          importMap: {},
        },
      } as unknown as PayloadRequest
      const docs = [
        { id: 'image', [titleField]: 'With thumbnail' },
        { id: 'placeholder', [titleField]: 'Without thumbnail' },
      ]

      const table = renderCollectionPreviewTable({
        collection,
        docs,
        label: 'Documents',
        req,
        thumbnailURLs: new Map([['image', '/preview.png']]),
      })
      const cells = table.props.columns[0].renderedCells
      const thumbnails = cells.map((cell) => cell.props.children[0])

      expect(thumbnails[0].props.children.props.fileSrc).toBe('/preview.png')
      expect(thumbnails[1].props.children.props.fileSrc).toBeUndefined()
      expect(thumbnails[1].props.children.props.placeholder.type).toBe('svg')
      expect(thumbnails.every((thumbnail) => thumbnail.props['aria-hidden'] === 'true')).toBe(true)
      expect(cells.every((cell) => cell.props.children[1])).toBe(true)
      expect(table.props.data).toBe(docs)
    },
  )

  it.each(['updatedBy', 'createdBy'])(
    'should show permitted authorship while leaving restricted %s blank',
    (restrictedField) => {
      const collection = {
        slug: 'pages',
        admin: { useAsTitle: 'title' },
        fields: [
          { name: 'title', type: 'text', admin: {} },
          ...['updatedBy', 'createdBy'].map((name) => ({
            name,
            type: 'relationship',
            relationTo: ['users'],
            admin: { hidden: true },
          })),
        ],
      } as unknown as SanitizedCollectionConfig
      const req = {
        i18n: { language: 'en', t: (key: string) => key },
        payload: {
          collections: { pages: { config: collection } },
          config: { db: { defaultIDType: 'text' }, routes: { admin: '/admin' } },
          importMap: {},
        },
      } as unknown as PayloadRequest
      const docs = [
        {
          id: '1',
          title: 'Private title',
          updatedBy: { relationTo: 'users', value: 'editor' },
          createdBy: { relationTo: 'users', value: 'author' },
        },
      ]

      const table = renderCollectionPreviewTable({
        collection,
        docs,
        fieldPermissions: {
          title: { read: false },
          updatedBy: { read: restrictedField !== 'updatedBy' },
          createdBy: { read: restrictedField !== 'createdBy' },
        },
        label: 'Pages',
        req,
        thumbnailURLs: new Map(),
      })
      const columns = table.props.columns
      const readableField = restrictedField === 'updatedBy' ? 'createdBy' : 'updatedBy'
      const readableCell = columns.find(({ accessor }) => accessor === readableField)
        .renderedCells[0]
      const fallbackTitle = columns[0].renderedCells[0].props.children[1]

      expect(columns).toHaveLength(4)
      expect(
        columns.find(({ accessor }) => accessor === restrictedField).renderedCells[0],
      ).toBeNull()
      expect(readableCell.props.Fallback.props.clientProps.cellData).toEqual(docs[0][readableField])
      expect(fallbackTitle.props.children).toBe('1')
      expect(fallbackTitle.props.href).toBe('/admin/collections/pages/1')
      expect(collection.fields.slice(1).every(({ admin }) => admin.hidden)).toBe(true)
    },
  )
})
