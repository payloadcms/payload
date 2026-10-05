import {
  beginDeferredCleanupScope,
  commitTransaction,
  flushDeferredCleanupScope,
} from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { getAfterChangeHook } from './afterChange.js'

describe('upload replacement cleanup', () => {
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
        variants: { thumbnail: { filename: 'thumb.png' } },
        prefix: newPrefix,
      }
      const req = {
        context: {},
        file: { data: Buffer.from('file'), size: 4 },
        payload: { db: {}, logger: { error: vi.fn() } },
      }
      const cleanupScope = await beginDeferredCleanupScope({ req: req as never })

      await hook({
        data: uploadData,
        doc: isSelected ? { id: 1 } : uploadData,
        select: isSelected ? {} : undefined,
        previousDoc: {
          id: 1,
          filename: 'file.png',
          mimeType: 'image/png',
          variants: { thumbnail: { filename: 'thumb.png' } },
          prefix: oldPrefix,
        },
        operation: 'update',
        req,
      } as never)
      await flushDeferredCleanupScope({ req: req as never, scope: cleanupScope! })

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

  it('should retain a cloud file that the main document still uses during a branch replacement', async () => {
    const handleDelete = vi.fn()
    const hook = getAfterChangeHook({
      adapter: { handleDelete, handleUpload: vi.fn() } as never,
      collection: { slug: 'media' } as never,
      collectionPrefix: 'media',
    })
    const req = {
      context: {},
      file: { data: Buffer.from('file'), size: 4 },
      payload: {
        db: {
          findOne: vi.fn().mockResolvedValue({
            _branch: 'main',
            filename: 'main.png',
            id: 1,
            prefix: 'media',
            sizes: {},
          }),
        },
        logger: { error: vi.fn() },
      },
    }
    const cleanupScope = await beginDeferredCleanupScope({ req: req as never })

    await hook({
      data: {
        _branch: 'campaign',
        _branchDocID: 1,
        filename: 'replacement.png',
        id: 2,
        mimeType: 'image/png',
        prefix: 'media',
        sizes: {},
      },
      doc: {
        _branch: 'campaign',
        _branchDocID: 1,
        filename: 'replacement.png',
        id: 2,
        mimeType: 'image/png',
        prefix: 'media',
        sizes: {},
      },
      operation: 'update',
      previousDoc: {
        _branch: 'campaign',
        _branchDocID: 1,
        filename: 'main.png',
        id: 2,
        mimeType: 'image/png',
        prefix: 'media',
        sizes: {},
      },
      req,
    } as never)
    await flushDeferredCleanupScope({ req: req as never, scope: cleanupScope! })

    expect(handleDelete).not.toHaveBeenCalled()
  })

  it('should defer replacement cleanup until the active transaction commits', async () => {
    const handleDelete = vi.fn()
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const hook = getAfterChangeHook({
      adapter: { handleDelete, handleUpload: vi.fn() } as never,
      collection: { slug: 'media' } as never,
      collectionPrefix: 'media',
    })
    const req = {
      context: {},
      file: { data: Buffer.from('new file'), size: 8 },
      payload: {
        db: { commitTransaction: databaseCommit },
        logger: { error: vi.fn() },
      },
      transactionID: 'transaction-id',
    }

    await hook({
      data: {
        filename: 'new.png',
        id: 1,
        mimeType: 'image/png',
        prefix: 'media',
        sizes: {},
      },
      doc: {
        filename: 'new.png',
        id: 1,
        mimeType: 'image/png',
        prefix: 'media',
        sizes: {},
      },
      operation: 'update',
      previousDoc: {
        filename: 'old.png',
        id: 1,
        mimeType: 'image/png',
        prefix: 'media',
        sizes: {},
      },
      req,
    } as never)

    expect(handleDelete).not.toHaveBeenCalled()

    await commitTransaction(req as never)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(handleDelete).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'old.png', storageFilePath: 'media/old.png' }),
    )
  })
})
