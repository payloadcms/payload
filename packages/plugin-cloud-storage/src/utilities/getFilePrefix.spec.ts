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
  describe('prefixQueryParam shortcut', () => {
    it('should return prefixQueryParam immediately without querying the database', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        prefixQueryParam: 'uuid-prefix',
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('uuid-prefix')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('should return an empty string when prefixQueryParam is an empty string', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        prefixQueryParam: '',
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('should reject multi-encoded values', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        prefixQueryParam: '%252e%252e%252fsecret%252f..%252fok',
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('should reject malformed percent-encoding', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        prefixQueryParam: '%E0%A4%A',
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
      expect(req.payload.find).not.toHaveBeenCalled()
    })
  })

  describe('database fallback', () => {
    it('should query the database when prefixQueryParam is not provided', async () => {
      const req = makeReq([{ prefix: 'db-prefix' }])

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('db-prefix')
      expect(req.payload.find).toHaveBeenCalledOnce()
    })

    it('should return empty string when no document is found and no field default exists', async () => {
      const req = makeReq([])

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
    })

    it('should prioritize the upload reference prefix over the database query', async () => {
      const req = makeReq([{ prefix: 'db-prefix' }])

      const result = await getFilePrefix({
        collection: makeCollection(),
        uploadReference: { prefix: 'context-prefix' },
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('context-prefix')
      expect(req.payload.find).not.toHaveBeenCalled()
    })
  })

  describe('field defaultValue fallback (mid-create transaction)', () => {
    it('should fall back to the prefix field defaultValue when DB returns no docs', async () => {
      // Simulates the crop/save flow: document not yet committed, DB returns
      // nothing, but the injected prefix field carries the configured default.
      const req = makeReq([])
      const collection: CollectionConfig = {
        ...makeCollection(),
        fields: [{ name: 'prefix', type: 'text', defaultValue: 'media/uploads' }],
      }

      const result = await getFilePrefix({
        collection,
        filename: 'photo.jpg',
        req,
      })

      expect(result).toBe('media/uploads')
    })

    it('should not fall back to the prefix field defaultValue when DB finds a doc', async () => {
      // DB has the committed doc — use its stored value, not the field default.
      const req = makeReq([{ prefix: 'stored-prefix' }])
      const collection: CollectionConfig = {
        ...makeCollection(),
        fields: [{ name: 'prefix', type: 'text', defaultValue: 'media/uploads' }],
      }

      const result = await getFilePrefix({
        collection,
        filename: 'photo.jpg',
        req,
      })

      expect(result).toBe('stored-prefix')
    })

    it('should not use the prefix field default when defaultValue is an empty string', async () => {
      // useCompositePrefixes sets defaultValue to '' — should not be returned.
      const req = makeReq([])
      const collection: CollectionConfig = {
        ...makeCollection(),
        fields: [{ name: 'prefix', type: 'text', defaultValue: '' }],
      }

      const result = await getFilePrefix({
        collection,
        filename: 'photo.jpg',
        req,
      })

      expect(result).toBe('')
    })

    it('should sanitize the prefix field defaultValue', async () => {
      // sanitizePrefix strips leading slashes and path-traversal segments.
      const req = makeReq([])
      const collection: CollectionConfig = {
        ...makeCollection(),
        fields: [{ name: 'prefix', type: 'text', defaultValue: '/media/uploads' }],
      }

      const result = await getFilePrefix({
        collection,
        filename: 'photo.jpg',
        req,
      })

      expect(result).toBe('media/uploads')
    })
  })
})
