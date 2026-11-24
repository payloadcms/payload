import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { parse } from 'csv-parse/sync'
import { describe, expect, it, vi } from 'vitest'

import { createExport } from './createExport.js'

const formulaPrefixedValues = [
  '=Quarterly total',
  '+Projected increase',
  '-Adjustment',
  '@Owner',
  '\tIndented value',
  '\rCarriage return value',
  '\nLine feed value',
  ' =Indented total',
  '＝Localized total',
  '＋Localized increase',
  '－Localized adjustment',
  '＠Localized owner',
]
const values = [...formulaPrefixedValues, "'=Quarterly total", 'Quarterly summary', -42]
const expectedValues = [
  ...formulaPrefixedValues.map((value) => `'${value}`),
  "'=Quarterly total",
  'Quarterly summary',
  '-42',
]

type CreateRequestArgs = {
  fieldName?: string
  fieldValues?: unknown[]
}

const createRequest = ({
  fieldName = 'title',
  fieldValues = values,
}: CreateRequestArgs = {}): PayloadRequest => {
  const flattenedFields = [{ name: fieldName, type: 'text' }]
  const collectionConfig = {
    flattenedFields,
    fields: flattenedFields,
    slug: 'posts',
  } as unknown as SanitizedCollectionConfig

  return {
    payload: {
      config: {
        collections: [collectionConfig],
      },
      count: vi.fn().mockResolvedValue({ totalDocs: fieldValues.length }),
      find: vi.fn().mockResolvedValue({
        docs: fieldValues.map((value) => ({ [fieldName]: value })),
        hasNextPage: false,
      }),
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
      },
    },
    t: vi.fn(),
    user: {
      collection: 'users',
      id: 'user-id',
    },
  } as unknown as PayloadRequest
}

const parseTitles = (csv: Buffer | string): string[] => {
  const records = parse(csv, {
    bom: true,
    columns: true,
  }) as Array<{ title: string }>

  return records.map(({ title }) => title)
}

const parseColumnNames = (csv: Buffer | string): string[] => {
  const records = parse(csv, {
    bom: true,
    columns: true,
  }) as Array<Record<string, string>>

  return Object.keys(records[0]!)
}

describe('createExport', () => {
  it('should preserve formula-prefixed values as text in streamed CSV files', async () => {
    const req = createRequest()

    const response = await createExport({
      collectionSlug: 'posts',
      download: true,
      exportCollection: 'exports',
      fields: ['title'],
      format: 'csv',
      id: 'export-id',
      name: 'quarterly-report',
      req,
      userCollection: '',
      userID: '',
    })

    expect(parseTitles(await response.text())).toEqual(expectedValues)
  })

  it('should preserve formula-prefixed values as text in saved CSV files', async () => {
    const req = createRequest()

    await createExport({
      collectionSlug: 'posts',
      exportCollection: 'exports',
      fields: ['title'],
      format: 'csv',
      id: '',
      name: 'quarterly-report',
      req,
      userCollection: '',
      userID: '',
    })

    expect(req.file).toBeDefined()
    expect(parseTitles(req.file!.data)).toEqual(expectedValues)
  })

  it('should preserve formula-prefixed column names as text in CSV files', async () => {
    const req = createRequest({ fieldName: '-legacy', fieldValues: ['Quarterly summary'] })

    const response = await createExport({
      collectionSlug: 'posts',
      download: true,
      exportCollection: 'exports',
      fields: ['-legacy'],
      format: 'csv',
      id: 'export-id',
      name: 'quarterly-report',
      req,
      userCollection: '',
      userID: '',
    })

    expect(parseColumnNames(await response.text())).toEqual(["'-legacy"])
  })
})
