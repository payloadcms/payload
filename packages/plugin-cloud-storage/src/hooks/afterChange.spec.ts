import { describe, expect, it, vi } from 'vitest'

import { getAfterChangeHook } from './afterChange.js'

describe('upload replacement cleanup', () => {
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
})
