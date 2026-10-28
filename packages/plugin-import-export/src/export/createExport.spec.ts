import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { parse } from 'csv-parse/sync'
import { describe, expect, it, vi } from 'vitest'

import { createExport } from './createExport.js'

const flattenedFields = [
  { name: 'id', type: 'text' },
  { name: 'title', type: 'text' },
  {
    name: 'array',
    type: 'array',
    fields: [
      { name: 'field1', type: 'text' },
      { name: 'field2', type: 'text' },
    ],
  },
]

const shortDoc = (id: string, title: string) => ({
  id,
  title,
  array: [{ id: `${id}-0`, field1: 'only', field2: 'one' }],
})

const longDoc = {
  id: '3',
  title: 'long',
  array: [
    { id: '3-0', field1: 'a', field2: '1' },
    { id: '3-1', field1: 'b', field2: '2' },
    { id: '3-2', field1: 'c', field2: '3' },
  ],
}

const pages = [
  { docs: [shortDoc('1', 'short-1'), shortDoc('2', 'short-2')], hasNextPage: true },
  { docs: [longDoc], hasNextPage: false },
]

function createReq({
  before,
}: {
  before?: (args: { data: Record<string, unknown>[] }) => Record<string, unknown>[]
} = {}) {
  const find = vi.fn(async ({ page }: { page?: number }) => {
    return pages[(page ?? 1) - 1] ?? { docs: [], hasNextPage: false }
  })

  const collectionConfig = {
    slug: 'pages',
    flattenedFields,
    ...(before
      ? {
          custom: {
            'plugin-import-export': {
              exportHooks: { before },
            },
          },
        }
      : {}),
  } as unknown as SanitizedCollectionConfig

  const req = {
    payload: {
      collections: {
        pages: { config: collectionConfig },
      },
      config: {
        collections: [collectionConfig],
      },
      count: vi.fn(async () => ({ totalDocs: 3 })),
      find,
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
      },
    },
    user: { id: 'user-1', collection: 'users' },
  } as unknown as PayloadRequest

  return { find, req }
}

describe('createExport streamed CSV columns', () => {
  it('should include array columns from a later batch in a streamed CSV download', async () => {
    const { find, req } = createReq()

    const response = await createExport({
      id: 'export-1',
      name: 'pages',
      batchSize: 2,
      collectionSlug: 'pages',
      download: true,
      exportCollection: 'exports',
      exportDoc: { name: 'pages' },
      fields: ['id', 'title', 'array'],
      format: 'csv',
      req,
    })

    // The header is chosen before any byte is streamed, so every page is read once up front.
    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))

    const csv = await response.text()
    const rows = parse(csv, { bom: true, columns: true }) as Record<string, string>[]

    expect(rows).toHaveLength(3)
    expect(Object.keys(rows[0] ?? {})).toEqual(
      expect.arrayContaining(['array_1_field1', 'array_2_field1', 'array_2_field2']),
    )

    const longRow = rows.find((row) => row.title === 'long')
    expect(longRow?.array_0_field1).toBe('a')
    expect(longRow?.array_1_field1).toBe('b')
    expect(longRow?.array_1_field2).toBe('2')
    expect(longRow?.array_2_field1).toBe('c')
    expect(longRow?.array_2_field2).toBe('3')

    const shortRow = rows.find((row) => row.title === 'short-1')
    expect(shortRow?.array_0_field1).toBe('only')
    expect(shortRow?.array_2_field1).toBe('')
  })

  it('should keep later-batch array columns when a before hook removes a first-batch column', async () => {
    const before = vi.fn((args: { data: Record<string, unknown>[] }) =>
      args.data.map((row) => {
        const { array_0_field2: _removed, ...rest } = row
        return rest
      }),
    )
    const { find, req } = createReq({ before })

    const response = await createExport({
      id: 'export-1',
      name: 'pages',
      batchSize: 2,
      collectionSlug: 'pages',
      download: true,
      exportCollection: 'exports',
      exportDoc: { name: 'pages' },
      fields: ['id', 'title', 'array'],
      format: 'csv',
      req,
    })

    const csv = await response.text()
    const rows = parse(csv, { bom: true, columns: true }) as Record<string, string>[]
    const header = Object.keys(rows[0] ?? {})

    // The hook runs once per streamed batch, not again during the column scan.
    expect(before).toHaveBeenCalledTimes(2)
    expect(find.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(header).not.toContain('array_0_field2')
    expect(header).toContain('array_2_field1')
    expect(rows.find((row) => row.title === 'long')?.array_2_field1).toBe('c')
  })

  it('should leave JSON downloads unchanged when a later document has a longer array', async () => {
    const { find, req } = createReq()

    const response = await createExport({
      id: 'export-1',
      name: 'pages',
      batchSize: 2,
      collectionSlug: 'pages',
      download: true,
      exportCollection: 'exports',
      exportDoc: { name: 'pages' },
      format: 'json',
      req,
    })

    expect(find).not.toHaveBeenCalled()

    const docs = JSON.parse(await response.text()) as {
      array: { field1: string }[]
      title: string
    }[]

    expect(find).toHaveBeenCalledTimes(2)
    expect(docs).toHaveLength(3)
    expect(docs.find((doc) => doc.title === 'long')?.array).toHaveLength(3)
    expect(docs.find((doc) => doc.title === 'long')?.array[2]?.field1).toBe('c')
  })
})
