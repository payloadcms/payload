import { describe, expect, it, vi } from 'vitest'

import type { CollectionConfig, PayloadRequest } from 'payload'

import { getFilePrefix } from './getFilePrefix.js'

const makeReq = (docs: unknown[] = []) =>
  ({
    payload: {
      find: vi.fn().mockResolvedValue({ docs }),
    },
  }) as unknown as PayloadRequest

const makeCollection = (): CollectionConfig =>
  ({ slug: 'media', upload: {} }) as unknown as CollectionConfig

describe('getFilePrefix', () => {
  describe('explicitPrefix shortcut', () => {
    it('should return explicitPrefix immediately without querying the database', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        explicitPrefix: 'uuid-prefix',
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('uuid-prefix')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('should return an empty string when explicitPrefix is an empty string', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        explicitPrefix: '',
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
      expect(req.payload.find).not.toHaveBeenCalled()
    })
  })

  describe('database fallback', () => {
    it('should query the database when explicitPrefix is not provided', async () => {
      const req = makeReq([{ prefix: 'db-prefix' }])

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('db-prefix')
      expect(req.payload.find).toHaveBeenCalledOnce()
    })

    it('should return empty string when no document is found', async () => {
      const req = makeReq([])

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
    })

    it('should prioritize clientUploadContext prefix over database query', async () => {
      const req = makeReq([{ prefix: 'db-prefix' }])

      const result = await getFilePrefix({
        clientUploadContext: { prefix: 'context-prefix' },
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('context-prefix')
      expect(req.payload.find).not.toHaveBeenCalled()
    })
  })
})
