import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

vi.mock('../../auth/executeAccess.js', () => ({
  executeAccess: vi.fn(),
}))

import { executeAccess } from '../../auth/executeAccess.js'

import { resolveUploadDocument } from './resolveUploadDocument.js'

const makeFindOne = (result: unknown = { id: '1', filename: 'logo.png', mimeType: 'image/png' }) =>
  vi.fn().mockResolvedValue(result)

const makeCollection = (overrides: { imageSizes?: { name: string }[] } = {}): Collection =>
  ({
    config: {
      slug: 'test-media',
      access: { read: vi.fn() },
      upload: { imageSizes: overrides.imageSizes },
    },
  }) as unknown as Collection

const makeReq = (findOne: ReturnType<typeof vi.fn>): PayloadRequest =>
  ({
    t: vi.fn(),
    payload: {
      db: { findOne },
    },
  }) as unknown as PayloadRequest

describe('resolveUploadDocument', () => {
  beforeEach(() => {
    vi.mocked(executeAccess).mockClear()
  })

  it('should match the primary filename', async () => {
    const findOne = makeFindOne()
    const req = makeReq(findOne)
    const collection = makeCollection()

    await resolveUploadDocument({ collection, filename: 'logo.png', req })

    const whereArg = findOne.mock.calls[0]?.[0]?.where
    expect(whereArg?.or).toEqual(expect.arrayContaining([{ filename: { equals: 'logo.png' } }]))
  })

  it("should match a configured legacy size's filename", async () => {
    const findOne = makeFindOne()
    const req = makeReq(findOne)
    const collection = makeCollection({ imageSizes: [{ name: 'thumbnail' }] })

    await resolveUploadDocument({ collection, filename: 'logo-thumbnail.png', req })

    const whereArg = findOne.mock.calls[0]?.[0]?.where
    expect(whereArg?.or).toEqual(
      expect.arrayContaining([{ 'sizes.thumbnail.filename': { equals: 'logo-thumbnail.png' } }]),
    )
  })

  it('should scope the query by prefix when provided', async () => {
    const findOne = makeFindOne()
    const req = makeReq(findOne)
    const collection = makeCollection()

    await resolveUploadDocument({ collection, filename: 'logo.png', prefix: 'abc123', req })

    const whereArg = findOne.mock.calls[0]?.[0]?.where
    expect(whereArg?.and).toEqual(expect.arrayContaining([{ prefix: { equals: 'abc123' } }]))
  })

  it('should not scope by prefix when it is omitted', async () => {
    const findOne = makeFindOne()
    const req = makeReq(findOne)
    const collection = makeCollection()

    await resolveUploadDocument({ collection, filename: 'logo.png', req })

    const whereArg = findOne.mock.calls[0]?.[0]?.where
    expect(whereArg?.and).toBeUndefined()
  })

  it('should reject path traversal in the filename without querying the database', async () => {
    const findOne = makeFindOne()
    const req = makeReq(findOne)
    const collection = makeCollection()

    await expect(
      resolveUploadDocument({ collection, filename: '../etc/passwd', req }),
    ).rejects.toThrow()
    expect(findOne).not.toHaveBeenCalled()
  })

  it('should return undefined cleanly when no document matches', async () => {
    const findOne = makeFindOne(null)
    const req = makeReq(findOne)
    const collection = makeCollection()

    const result = await resolveUploadDocument({ collection, filename: 'missing.png', req })

    expect(result).toBeUndefined()
  })

  it('should return the resolved document, including its mimeType', async () => {
    const doc = { id: '1', filename: 'logo.png', mimeType: 'image/png' }
    const findOne = makeFindOne(doc)
    const req = makeReq(findOne)
    const collection = makeCollection()

    const result = await resolveUploadDocument({ collection, filename: 'logo.png', req })

    expect(result).toEqual(doc)
  })

  it('should never call executeAccess, since resolution runs unconditionally and before access enforcement', async () => {
    const findOne = makeFindOne()
    const req = makeReq(findOne)
    const collection = makeCollection()

    await resolveUploadDocument({ collection, filename: 'logo.png', req })

    expect(executeAccess).not.toHaveBeenCalled()
  })
})
