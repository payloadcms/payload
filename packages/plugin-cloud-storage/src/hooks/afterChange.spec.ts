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

  it('should restore crop instructions when an internal metadata update fails', async () => {
    const doc = { id: 1, filename: 'processed.png', mimeType: 'image/png' }
    const uploadEdits = { crop: { height: 50, width: 50, x: 0, y: 0 } }
    const req = {
      context: {},
      file: { data: Buffer.from('processed'), size: 9 },
      payload: {
        logger: { error: vi.fn() },
        update: vi.fn(async () => {
          expect(req.query.uploadEdits).toBeUndefined()
          throw new Error('update failed')
        }),
      },
      query: { uploadEdits },
    }
    const hook = getAfterChangeHook({
      adapter: { handleUpload: vi.fn(async () => ({ filename: 'processed-1.png' })) } as never,
      collection: { slug: 'media' } as never,
    })

    await expect(hook({ data: doc, doc, operation: 'create', req } as never)).rejects.toThrow(
      'update failed',
    )

    expect(req.query.uploadEdits).toBe(uploadEdits)
    expect(req.context).not.toHaveProperty('skipCloudStorage')
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

  it('should persist a field changed by an adapter that mutates and returns data', async () => {
    const doc = { id: 1, filename: 'original.png', mimeType: 'image/png' }
    const update = vi.fn(async () => doc)
    const hook = getAfterChangeHook({
      adapter: {
        handleUpload: vi.fn(({ data }) => {
          data.filename = 'original-suffixed.png'
          return data
        }),
      } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('image'), size: 5 },
        payload: { logger: { error: vi.fn() }, update },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { filename: 'original-suffixed.png' } }),
    )
  })

  it('should persist a nested field changed by an adapter that mutates and returns data', async () => {
    const doc = { id: 1, filename: 'original.png', mimeType: 'image/png', meta: { cdnId: 'old' } }
    const update = vi.fn(async () => doc)
    const hook = getAfterChangeHook({
      adapter: {
        handleUpload: vi.fn(({ data }) => {
          data.meta.cdnId = 'new'
          return data
        }),
      } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('image'), size: 5 },
        payload: { logger: { error: vi.fn() }, update },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { meta: { cdnId: 'new' } } }),
    )
    expect(doc.meta.cdnId).toBe('old')
  })

  it('should not persist an unchanged nested value from copied adapter data', async () => {
    class Metadata {
      constructor(readonly cdnId: string) {}
    }

    const doc = {
      id: 1,
      filename: 'original.png',
      meta: new Metadata('same'),
      mimeType: 'image/png',
    }
    const update = vi.fn(async () => doc)
    const hook = getAfterChangeHook({
      adapter: { handleUpload: vi.fn(({ data }) => ({ ...data, url: '/original.png' })) } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('image'), size: 5 },
        payload: { logger: { error: vi.fn() }, update },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { url: '/original.png' } }))
  })

  it('should save a size field changed within data.sizes at the correct level', async () => {
    const doc = {
      id: 1,
      filename: 'original.png',
      mimeType: 'image/png',
      sizes: { square: { filename: 'square.png', mimeType: 'image/png' } },
    }
    const update = vi.fn(async () => doc)
    const hook = getAfterChangeHook({
      adapter: {
        handleUpload: vi.fn(({ data, file }) => {
          if (file.sizeName === 'square') {
            data.sizes.square.filename = 'square-suffixed.png'
            return data
          }
        }),
      } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('main'), size: 4 },
        payload: { logger: { error: vi.fn() }, update },
        payloadUploadSizes: { square: Buffer.from('size') },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          sizes: { square: { filename: 'square-suffixed.png', mimeType: 'image/png' } },
        },
      }),
    )
  })

  it('should retain a main-file size change when the size upload adds metadata', async () => {
    const doc = {
      id: 1,
      filename: 'original.png',
      mimeType: 'image/png',
      sizes: { square: { filename: 'square.png', mimeType: 'image/png' } },
    }
    const update = vi.fn(async () => doc)
    const hook = getAfterChangeHook({
      adapter: {
        handleUpload: vi.fn(({ data, file }) => {
          if (file.sizeName) {
            data.sizes.square.url = '/square-url'
            return data
          }
          return { sizes: { square: { ...data.sizes.square, filename: 'square-renamed.png' } } }
        }),
      } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('main'), size: 4 },
        payload: { logger: { error: vi.fn() }, update },
        payloadUploadSizes: { square: Buffer.from('size') },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          sizes: {
            square: {
              filename: 'square-renamed.png',
              mimeType: 'image/png',
              url: '/square-url',
            },
          },
        },
      }),
    )
  })

  it('should keep unchanged document fields out of copied image-size metadata', async () => {
    const doc = {
      id: 1,
      filename: 'original.png',
      mimeType: 'image/png',
      sizes: { square: { filename: 'original-30x20.png', mimeType: 'image/png' } },
    }
    const update = vi.fn(
      async (_args: { data: { sizes: { square: Record<string, unknown> } } }) => doc,
    )
    const hook = getAfterChangeHook({
      adapter: {
        handleUpload: vi.fn(({ data, file }) =>
          file.filename === doc.filename
            ? undefined
            : { ...data, sizes: { ...data.sizes }, url: '/square.png' },
        ),
      } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('main'), size: 4 },
        payload: { logger: { error: vi.fn() }, update },
        payloadUploadSizes: { square: Buffer.from('size') },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sizes: expect.objectContaining({
            square: expect.objectContaining({ filename: 'original-30x20.png', url: '/square.png' }),
          }),
        }),
      }),
    )
    expect(update.mock.calls[0]?.[0]?.data.sizes.square.sizes).toBeUndefined()
  })

  it('should associate image-size results by size name when filenames match', async () => {
    const doc = {
      id: 1,
      filename: 'original.png',
      mimeType: 'image/png',
      sizes: {
        square: { filename: 'original-30x20.png', mimeType: 'image/png' },
        thumbnail: { filename: 'original-30x20.png', mimeType: 'image/png' },
      },
    }
    const update = vi.fn(async () => doc)
    const hook = getAfterChangeHook({
      adapter: {
        handleUpload: vi.fn(({ file }) =>
          file.buffer.toString() === 'main'
            ? undefined
            : { filename: `${file.buffer.toString()}-suffixed.png` },
        ),
      } as never,
      collection: { slug: 'media' } as never,
    })

    await hook({
      data: doc,
      doc,
      operation: 'create',
      req: {
        context: {},
        file: { data: Buffer.from('main'), size: 4 },
        payload: { logger: { error: vi.fn() }, update },
        payloadUploadSizes: {
          square: Buffer.from('square'),
          thumbnail: Buffer.from('thumbnail'),
        },
      },
    } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sizes: expect.objectContaining({
            square: expect.objectContaining({ filename: 'square-suffixed.png' }),
            thumbnail: expect.objectContaining({ filename: 'thumbnail-suffixed.png' }),
          }),
        }),
      }),
    )
  })

  it('should not reuse a completed upload from the same request', async () => {
    const doc = { id: 1, filename: 'original.png', mimeType: 'image/png' }
    const file = { data: Buffer.from('image'), size: 5 }
    const handleUpload = vi.fn(({ data }) => data)
    const hook = getAfterChangeHook({
      adapter: { handleUpload } as never,
      collection: { slug: 'media' } as never,
    })
    const req = {
      context: { _payloadCloudStorage: { file, uploadSizes: undefined } },
      file,
      payload: { logger: { error: vi.fn() }, update: vi.fn() },
    }

    await hook({ data: doc, doc, operation: 'create', req } as never)
    await hook({ data: doc, doc, operation: 'update', req } as never)

    expect(handleUpload).toHaveBeenCalledOnce()
    expect(req.file).toBeUndefined()
  })

  it('should preserve a temp-file path for cleanup after clearing upload request state', async () => {
    const doc = { id: 1, filename: 'original.png', mimeType: 'image/png' }
    const file = { data: Buffer.from('image'), size: 5, tempFilePath: '/tmp/upload-image' }
    const hook = getAfterChangeHook({
      adapter: { handleUpload: vi.fn(() => undefined) } as never,
      collection: { slug: 'media' } as never,
    })
    const req = {
      context: { _payloadCloudStorage: { file, uploadSizes: undefined } },
      file,
      payload: { logger: { error: vi.fn() }, update: vi.fn() },
    }

    await hook({ data: doc, doc, operation: 'create', req } as never)

    expect(req.file).toBeUndefined()
    expect(req.context).toHaveProperty('_payloadCloudStorageTempFilePath', '/tmp/upload-image')
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
