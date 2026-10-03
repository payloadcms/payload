import { describe, expect, it, vi } from 'vitest'

import { getAfterChangeHook } from './afterChange.js'
import { getPreserveFileDataHook } from './preserveFileData.js'

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

describe('reused request context', () => {
  const uploadDoc = { id: 1, filename: 'file.png', mimeType: 'image/png' }

  // `createLocalReq` returns the caller's `context` object as-is while it is
  // empty and replaces `req.context` with a spread copy once it is not.
  const buildReq = (context: Record<string, unknown>) => {
    const req: Record<string, unknown> = {
      context,
      payload: {
        logger: { error: vi.fn() },
        update: vi.fn(),
      },
    }

    ;(req.payload as { update: ReturnType<typeof vi.fn> }).update.mockImplementation(async () => {
      req.context = { ...(req.context as Record<string, unknown>) }
      return uploadDoc
    })

    return req
  }

  it('should not leave its private keys on a context object owned by the caller', async () => {
    const callerContext: Record<string, unknown> = { disableRevalidate: true }
    const req = buildReq(callerContext)
    req.file = { data: Buffer.from('first'), size: 5 }

    const hook = getAfterChangeHook({
      adapter: {
        handleDelete: vi.fn(),
        handleUpload: vi.fn(async () => ({ filesize: 5 })),
      } as never,
      collection: { slug: 'media' } as never,
    })

    getPreserveFileDataHook()({ req } as never)
    await hook({ data: uploadDoc, doc: uploadDoc, operation: 'create', req } as never)

    expect((req.payload as { update: ReturnType<typeof vi.fn> }).update).toHaveBeenCalled()
    expect(callerContext.skipCloudStorage).toBeUndefined()
    expect(callerContext._payloadCloudStorage).toBeUndefined()
    // untouched
    expect(callerContext.disableRevalidate).toBe(true)
  })

  it('should upload every file when one context object is reused across local API calls', async () => {
    const callerContext: Record<string, unknown> = { disableRevalidate: true }
    const handleUpload = vi.fn(async () => ({ filesize: 5 }))
    const hook = getAfterChangeHook({
      adapter: { handleDelete: vi.fn(), handleUpload } as never,
      collection: { slug: 'media' } as never,
    })
    const preserveFileData = getPreserveFileDataHook()

    for (const contents of ['first', 'second']) {
      const req = buildReq(callerContext)
      req.file = { data: Buffer.from(contents), size: contents.length }

      preserveFileData({ req } as never)
      await hook({ data: uploadDoc, doc: uploadDoc, operation: 'create', req } as never)
    }

    expect(handleUpload).toHaveBeenCalledTimes(2)
    expect(
      handleUpload.mock.calls.map(([args]) =>
        (args as { file: { buffer: Buffer } }).file.buffer.toString(),
      ),
    ).toEqual(['first', 'second'])
  })
})
