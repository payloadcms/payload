import type { CollectionConfig, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

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
  it('prefers an already-authorized document over an upload reference or query prefix', async () => {
    const req = makeReq([{ prefix: 'db-prefix' }])
    const doc = { id: '1', prefix: 'invoices' }

    const result = await getFilePrefix({
      collection: makeCollection(),
      collectionPrefix: 'media',
      doc,
      filename: 'logo.png',
      prefixQueryParam: 'query-prefix',
      req,
      uploadReference: { prefix: 'reference-prefix' },
    })

    expect(result).toBe('invoices')
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('does not fall back to a lookup when the checked document has no prefix', async () => {
    const req = makeReq([{ prefix: 'db-prefix' }])

    const result = await getFilePrefix({
      collection: makeCollection(),
      collectionPrefix: 'media',
      doc: { id: '1' },
      filename: 'logo.png',
      req,
    })

    expect(result).toBe('')
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('contains an upload reference prefix beneath the collection prefix', async () => {
    const req = makeReq()

    const result = await getFilePrefix({
      collection: makeCollection(),
      collectionPrefix: 'media',
      filename: 'file.png',
      req,
      uploadReference: { prefix: 'invoices' },
    })

    expect(result).toBe('media/invoices')
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  describe('verified upload reference (trusted)', () => {
    it('folds the object key into the prefix and skips the database', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
        uploadReference: { _objectKey: 'abc123', prefix: 'documents' },
      })

      expect(result).toBe('documents/abc123')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('returns the prefix alone when the reference has no object key', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        filename: 'logo.png',
        req,
        uploadReference: { prefix: 'documents' },
      })

      expect(result).toBe('documents')
    })
  })

  describe('authorized document (trusted)', () => {
    it('folds the object key into the document prefix and skips the database', async () => {
      const req = makeReq([{ prefix: 'db-prefix' }])

      const result = await getFilePrefix({
        collection: makeCollection(),
        doc: { id: '1', _objectKey: 'abc123', prefix: 'doc-prefix' },
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('doc-prefix/abc123')
      expect(req.payload.find).not.toHaveBeenCalled()
    })

    it('returns the document prefix alone when it has no object key', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        doc: { id: '1', prefix: 'doc-prefix' },
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('doc-prefix')
    })

    it('sanitizes the document prefix', async () => {
      const req = makeReq()

      const result = await getFilePrefix({
        collection: makeCollection(),
        doc: { id: '1', prefix: '../secret' },
        filename: 'logo.png',
        req,
      })

      expect(result).toBe('secret')
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

    it('omits the prefix filter when the collection has no prefix field', async () => {
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
