import { describe, expect, it, vi } from 'vitest'

import { getAfterChangeHook } from './afterChange.js'

describe('upload replacement cleanup', () => {
  it('should clear crop instructions during an internal metadata update', async () => {
    const doc = { id: 1, filename: 'processed.png', mimeType: 'image/png' }
    const uploadEdits = { crop: { height: 50, width: 50, x: 0, y: 0 } }
    const req = {
      context: {},
      file: { data: Buffer.from('processed'), size: 9 },
      payload: {
        logger: { error: vi.fn() },
        update: vi.fn(async () => {
          expect(req.query.uploadEdits).toBeUndefined()
          return doc
        }),
      },
      query: { uploadEdits },
    }
    const hook = getAfterChangeHook({
      adapter: { handleUpload: vi.fn(async () => ({ filename: 'processed-1.png' })) } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({ data: doc, doc, operation: 'create', req } as never)

    expect(req.payload.update).toHaveBeenCalledOnce()
    expect(req.query.uploadEdits).toBe(uploadEdits)
  })

  it('should not update an unchanged document after an adapter echoes upload data', async () => {
    const doc = { id: 1, filename: 'processed.png', mimeType: 'image/png' }
    const update = vi.fn()
    const hook = getAfterChangeHook({
      adapter: { handleUpload: vi.fn(({ data }) => data) } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('processed'), size: 9 },
        payload: { logger: { error: vi.fn() }, update },
        query: { uploadEdits: { crop: { height: 50, width: 50, x: 0, y: 0 } } },
      },
    } as never)

    expect(update).not.toHaveBeenCalled()
  })

  it.each([
    [
      'invoices',
      'media/invoices',
      [
        { filename: 'file.png', prefix: 'invoices' },
        { filename: 'thumb.png', prefix: 'invoices' },
      ],
    ],
    ['', 'media', []],
    ['media/invoices', 'media/invoices', []],
  ] as const)(
    'should compare object locations when replacing %s with %s',
    async (oldPrefix, newPrefix, expectedDeletes) => {
      const handleDelete = vi.fn()
      const hook = getAfterChangeHook({
        adapter: { handleUpload: vi.fn(), handleDelete } as never,
        collection: { slug: 'media' } as never,
        collectionPrefix: 'media',
      })

      await hook({
        doc: {
          id: 1,
          filename: 'file.png',
          mimeType: 'image/png',
          sizes: { thumbnail: { filename: 'thumb.png' } },
          prefix: newPrefix,
        },
        previousDoc: {
          id: 1,
          filename: 'file.png',
          mimeType: 'image/png',
          sizes: { thumbnail: { filename: 'thumb.png' } },
          prefix: oldPrefix,
        },
        operation: 'update',
        req: {
          context: {},
          file: { data: Buffer.from('file'), size: 4 },
          payload: { logger: { error: vi.fn() } },
        },
      } as never)

      expect(
        handleDelete.mock.calls.map(([{ doc, filename }]) => ({
          filename,
          prefix: doc.prefix,
        })),
      ).toEqual(expectedDeletes)
    },
  )

  it('should delete a replaced client upload at its _objectKey folder', async () => {
    const handleDelete = vi.fn()
    const hook = getAfterChangeHook({
      adapter: { handleUpload: vi.fn(), handleDelete } as never,
      collection: { slug: 'media' } as never,
      collectionPrefix: 'media',
    })

    await hook({
      doc: {
        id: 1,
        _objectKey: 'new-key',
        filename: 'file.png',
        mimeType: 'image/png',
        prefix: 'media/invoices',
        sizes: { thumbnail: { filename: 'thumb.png' } },
      },
      previousDoc: {
        id: 1,
        _objectKey: 'old-key',
        filename: 'file.png',
        mimeType: 'image/png',
        prefix: 'media/invoices',
        sizes: { thumbnail: { filename: 'thumb.png' } },
      },
      operation: 'update',
      req: {
        context: {},
        file: { data: Buffer.from('file'), size: 4 },
        payload: { logger: { error: vi.fn() } },
      },
    } as never)

    expect(
      handleDelete.mock.calls.map(([{ filename, storageFilePath }]) => ({
        filename,
        storageFilePath,
      })),
    ).toEqual([
      { filename: 'file.png', storageFilePath: 'media/invoices/old-key/file.png' },
      { filename: 'thumb.png', storageFilePath: 'media/invoices/old-key/thumb.png' },
    ])
  })
  it('should restore the hidden storage key without exposing other hidden fields', async () => {
    const doc = { id: 1, filename: 'file.png', mimeType: 'image/png', prefix: 'images' }
    const handleUpload = vi.fn(({ data }) => data)
    const hook = getAfterChangeHook({
      adapter: { handleUpload } as never,
      collection: { slug: 'media' } as never,
    })
    const result = await hook({
      data: { ...doc, _objectKey: 'upload-key', privateNote: 'hidden' },
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('file'), size: 4 },
        payload: {
          logger: { error: vi.fn() },
          update: vi.fn(async () => doc),
        },
      },
    } as never)

    expect(handleUpload).toHaveBeenCalledWith(
      expect.objectContaining({ storageFilePath: 'images/upload-key/file.png' }),
    )
    expect(result).not.toHaveProperty('privateNote')
    expect(result).not.toHaveProperty('_objectKey')
  })
})
