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
})
