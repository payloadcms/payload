import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

vi.mock('../auth/executeAccess.js', () => ({
  executeAccess: vi.fn(),
}))

import { executeAccess } from '../auth/executeAccess.js'

import { checkFileAccess } from './checkFileAccess.js'

const makeFindOne = (result: unknown = { id: '1', filename: 'logo.png' }) =>
  vi.fn().mockResolvedValue(result)

const makeCollection = (): Collection =>
  ({
    config: {
      slug: 'test-media',
      access: { read: vi.fn() },
      upload: {},
    },
  }) as unknown as Collection

const makeReq = (findOne: ReturnType<typeof vi.fn>): PayloadRequest =>
  ({
    t: vi.fn(),
    payload: {
      db: { findOne },
    },
  }) as unknown as PayloadRequest

describe('checkFileAccess', () => {
  beforeEach(() => {
    vi.mocked(executeAccess).mockResolvedValue({})
  })

  describe('prefix filtering', () => {
    it('should add prefix clause to where query when prefix is provided', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await checkFileAccess({ collection, filename: 'logo.png', prefix: 'abc123', req })

      const whereArg = findOne.mock.calls[0]?.[0]?.where
      expect(whereArg?.and).toEqual(expect.arrayContaining([{ prefix: { equals: 'abc123' } }]))
    })

    it('should not add prefix clause to where query when prefix is omitted', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await checkFileAccess({ collection, filename: 'logo.png', req })

      const whereArg = findOne.mock.calls[0]?.[0]?.where
      const hasPrefixCondition = whereArg?.and?.some(
        (clause: Record<string, unknown>) => 'prefix' in clause,
      )
      expect(hasPrefixCondition).toBeFalsy()
    })

    it('should still include filename in where query when prefix is provided', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await checkFileAccess({ collection, filename: 'logo.png', prefix: 'abc123', req })

      const whereArg = findOne.mock.calls[0]?.[0]?.where
      const filenameCondition = whereArg?.and?.[0]
      expect(filenameCondition?.or).toEqual(
        expect.arrayContaining([{ filename: { equals: 'logo.png' } }]),
      )
    })

    it('should throw when no doc matches the given prefix', async () => {
      const findOne = makeFindOne(null)
      const req = makeReq(findOne)
      const collection = makeCollection()

      await expect(
        checkFileAccess({ collection, filename: 'logo.png', prefix: 'nonexistent', req }),
      ).rejects.toThrow()
    })

    it('should throw when filename contains path traversal sequence', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await expect(
        checkFileAccess({ collection, filename: '../etc/passwd', req }),
      ).rejects.toThrow()
    })
  })

  describe('draft filtering', () => {
    it('should add _status draft clause to where query when draft is true', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await checkFileAccess({ collection, draft: true, filename: 'logo.png', req })

      const whereArg = findOne.mock.calls[0]?.[0]?.where
      expect(whereArg?.and).toEqual(
        expect.arrayContaining([{ _status: { equals: 'draft' } }]),
      )
    })

    it('should not add _status clause when draft is false', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await checkFileAccess({ collection, draft: false, filename: 'logo.png', req })

      const whereArg = findOne.mock.calls[0]?.[0]?.where
      const hasStatusCondition = whereArg?.and?.some(
        (clause: Record<string, unknown>) => '_status' in clause,
      )
      expect(hasStatusCondition).toBeFalsy()
    })

    it('should not add _status clause when draft is omitted', async () => {
      const findOne = makeFindOne()
      const req = makeReq(findOne)
      const collection = makeCollection()

      await checkFileAccess({ collection, filename: 'logo.png', req })

      const whereArg = findOne.mock.calls[0]?.[0]?.where
      const hasStatusCondition = whereArg?.and?.some(
        (clause: Record<string, unknown>) => '_status' in clause,
      )
      expect(hasStatusCondition).toBeFalsy()
    })
  })
})
