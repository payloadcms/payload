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
    ['invoices', 'media/invoices', true, false],
    ['invoices', 'media/invoices', true, true],
    ['', 'media', false, false],
    ['media/invoices', 'media/invoices', false, false],
  ] as const)(
    'should compare object locations when replacing %s with %s (delete: %s, selected: %s)',
    async (oldPrefix, newPrefix, shouldDelete, isSelected) => {
      const handleDelete = vi.fn()
      const hook = getAfterChangeHook({
        adapter: { handleUpload: vi.fn(), handleDelete } as never,
        collection: { slug: 'media' } as never,
        collectionPrefix: 'media',
      })

      const uploadData = {
        id: 1,
        filename: 'file.png',
        mimeType: 'image/png',
        sizes: { thumbnail: { filename: 'thumb.png' } },
        prefix: newPrefix,
      }

      await hook({
        data: uploadData,
        doc: isSelected ? { id: 1 } : uploadData,
        select: isSelected ? {} : undefined,
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

      expect(handleDelete).toHaveBeenCalledTimes(shouldDelete ? 2 : 0)
      if (shouldDelete) {
        expect(handleDelete).toHaveBeenCalledWith(
          expect.objectContaining({
            doc: expect.objectContaining({ prefix: oldPrefix }),
            filename: 'file.png',
          }),
        )
      }
    },
  )

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
