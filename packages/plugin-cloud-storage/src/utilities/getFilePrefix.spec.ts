import { describe, expect, it, vi } from 'vitest'

import type { CollectionConfig, PayloadRequest } from 'payload'

import { getFilePrefix } from './getFilePrefix.js'

const makeReq = (docs: unknown[] = []) =>
  ({
    payload: {
      find: vi.fn().mockResolvedValue({ docs }),
    },
  }) as unknown as PayloadRequest

const makeCollection = ({
  hasPrefixField = false,
}: { hasPrefixField?: boolean } = {}): CollectionConfig =>
  ({
    slug: 'media',
    fields: hasPrefixField ? [{ name: 'prefix', type: 'text' }] : [],
    upload: {},
  }) as unknown as CollectionConfig

const whereOf = (req: PayloadRequest) =>
  JSON.stringify(
    (req.payload.find as unknown as { mock: { calls: [{ where: unknown }][] } }).mock.calls[0][0]
      .where,
  )

describe('getFilePrefix', () => {
  describe('verified clientUploadContext (trusted)', () => {
    it('folds the server-owned object key into the prefix and skips the database', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        clientUploadContext: { _objectKey: 'abc123', prefix: 'documents' },
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('documents/abc123')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('returns the prefix alone when the context has no object key', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        clientUploadContext: { prefix: 'documents' },
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('documents')
    })
  })

  describe('access-controlled database resolution', () => {
    it('does NOT short-circuit on a client-supplied prefix — the access-controlled query still runs', async () => {
      const req = makeReq([{ _objectKey: 'abc123', prefix: 'documents' }])

      await getFilePrefix({
        collection: makeCollection({ hasPrefixField: true }),
        filename: 'logo.png',
        prefixQueryParam: 'documents',
        req,
      })

      // A client-supplied prefix must not bypass the access-controlled lookup.
      expect(req.payload.find).toHaveBeenCalledOnce()
    })

    it('queries with access control enabled and hidden fields', async () => {
      const req = makeReq([{ prefix: 'db-prefix' }])

      await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(req.payload.find).toHaveBeenCalledWith(
        expect.objectContaining({ overrideAccess: false, req, showHiddenFields: true }),
      )
    })

    it('folds the stored object key into the resolved prefix', async () => {
      const req = makeReq([{ _objectKey: 'abc123', prefix: 'db-prefix' }])

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('db-prefix/abc123')
    })

    it('returns an empty string when no document is found', async () => {
      const req = makeReq([])

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('')
    })

    it('prioritizes a verified clientUploadContext over the database query', async () => {
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

  describe('client prefix as a disambiguation filter only', () => {
    it('adds the prefix filter when the collection persists a prefix field', async () => {
      const req = makeReq([{ prefix: 'documents' }])

      await getFilePrefix({
        collection: makeCollection({ hasPrefixField: true }),
        filename: 'logo.png',
        prefixQueryParam: 'documents',
        req,
      })

      expect(whereOf(req)).toContain('prefix')
    })

    it('omits the prefix filter when the collection has no prefix field (avoids querying a missing field)', async () => {
      const req = makeReq([{ prefix: '' }])

      await getFilePrefix({
        collection: makeCollection({ hasPrefixField: false }),
        filename: 'logo.png',
        prefixQueryParam: 'anything',
        req,
      })

      expect(whereOf(req)).not.toContain('prefix')
    })
  })
})
