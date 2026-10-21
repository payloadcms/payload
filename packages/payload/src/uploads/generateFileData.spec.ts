import type { Field, Validate } from '../fields/config/types.js'
import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateFileData } from './generateFileData.js'
import { validateTransformedDocument } from './validateTransformedDocument.js'

// A minimal valid 1x1 transparent PNG, so `file-type` can detect `image/png` from it.
const PNG_SIGNATURE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
)

const GIF_SIGNATURE = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

const createSharpMock = () => {
  const toBufferMock = vi.fn().mockResolvedValue({
    data: PNG_SIGNATURE,
    info: { height: 1, width: 1, size: PNG_SIGNATURE.length },
  })
  const metadataMock = vi.fn().mockResolvedValue({ height: 1, width: 1 })

  const chain: any = {
    metadata: metadataMock,
    resize: vi.fn(() => chain),
    rotate: vi.fn(() => chain),
    toBuffer: toBufferMock,
    toFormat: vi.fn(() => chain),
    withMetadata: vi.fn(() => chain),
  }
  chain.trim = vi.fn(() => chain)

  const sharp = vi.fn(() => chain)

  return { sharp, toBufferMock }
}

const createCollection = (uploadOverrides: Record<string, unknown> = {}): Collection =>
  ({
    config: {
      slug: 'media',
      fields: [],
      upload: {
        disableLocalStorage: true,
        focalPoint: false,
        staticDir: os.tmpdir(),
        ...uploadOverrides,
      },
    },
  }) as unknown as Collection

describe('generateFileData', () => {
  let tempFilePath: string

  beforeEach(async () => {
    tempFilePath = path.join(os.tmpdir(), `generate-file-data-test-${randomUUID()}`)
    await fs.writeFile(tempFilePath, PNG_SIGNATURE)
  })

  afterEach(async () => {
    await fs.rm(tempFilePath, { force: true })
  })

  const createReq = (sharp: unknown): PayloadRequest =>
    ({
      file: {
        data: Buffer.alloc(0),
        mimetype: 'image/png',
        name: 'photo.png',
        size: PNG_SIGNATURE.length,
        tempFilePath,
      },
      payload: {
        config: { sharp },
        logger: { error: vi.fn() },
      },
    }) as unknown as PayloadRequest

  it.each([false, true])(
    'should replay a retained original through bounded reads without eager buffering (legacy: %s)',
    async (isLegacy) => {
      let transformCalls = 0
      const filename = path.basename(tempFilePath)
      const req = createReq(undefined)
      req.file = undefined
      req.payload.config.routes = { api: '/api' } as any
      req.payload.config.upload = {
        transformers: [
          {
            slug: 'inspect',
            mimeTypes: ['image/png'],
            canTransform: () => ({ canTransform: true, handledTransformKeys: ['inspect'] }),
            transformFile: async ({ source }) => {
              transformCalls++
              expect(Buffer.from(await source.read({ length: 8 }))).toEqual(
                PNG_SIGNATURE.subarray(0, 8),
              )
              return { status: 'continue' }
            },
          },
        ],
      } as any
      const originalDoc = {
        id: '1',
        filename,
        mimeType: 'image/png',
        filesize: PNG_SIGNATURE.length,
        url: `/api/media/file/${filename}`,
        original: {
          filename,
          url: '/original',
          mimeType: 'image/png',
          filesize: PNG_SIGNATURE.length,
          width: 1,
          height: 1,
        },
      }
      if (isLegacy) {
        delete (originalDoc as any).original
      }
      const readFile = vi
        .spyOn(fs, 'readFile')
        .mockRejectedValue(new Error('Unexpected whole original read.'))

      try {
        const result = await generateFileData({
          collection: createCollection({
            disableLocalStorage: false,
            staticDir: path.dirname(tempFilePath),
          }),
          config: {} as SanitizedConfig,
          data: { _transforms: { inspect: true } },
          originalDoc,
          operation: 'update',
          overwriteExistingFiles: true,
          req,
        })

        expect(transformCalls).toBe(1)
        expect(result.files).toEqual([])
        expect(readFile).not.toHaveBeenCalled()
      } finally {
        readFile.mockRestore()
      }
    },
  )

  it.each([
    { url: 'https://external.example/image.png', filesize: PNG_SIGNATURE.length },
    { url: '/api/media/file/logical.png', filesize: null },
  ])('should not infer original ownership from an unverified descriptor %j', async (descriptor) => {
    const req = createReq(undefined)
    req.file = undefined
    req.payload.config.routes = { api: '/api' } as any
    req.payload.config.upload = { transformers: [] } as any
    const originalDoc = { filename: 'logical.png', mimeType: 'image/png', ...descriptor }

    const result = await generateFileData({
      collection: createCollection({ disableLocalStorage: false }),
      config: req.payload.config,
      originalDoc,
      data: { _transforms: { custom: true } },
      operation: 'update',
      req,
    })

    expect(result.files).toEqual([])
    expect(result.data).not.toHaveProperty('original')
    expect(originalDoc).not.toHaveProperty('original')
  })

  it('does not run full sharp processing on an image with no configured adjustments, even when it arrives via tempFilePath', async () => {
    const { sharp, toBufferMock } = createSharpMock()

    await generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req: createReq(sharp),
    })

    expect(toBufferMock).not.toHaveBeenCalled()
  })

  describe('focal point without a transformer', () => {
    const createPngReq = ({ query = {} }: { query?: Record<string, unknown> } = {}) =>
      ({
        file: {
          data: PNG_SIGNATURE,
          mimetype: 'image/png',
          name: 'photo.png',
          size: PNG_SIGNATURE.length,
        },
        payload: {
          config: {},
          logger: { error: vi.fn() },
        },
        query,
      }) as unknown as PayloadRequest

    it('should leave canonical focal intent absent by default', async () => {
      const result = await generateFileData({
        collection: createCollection({ focalPoint: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createPngReq(),
      })

      expect(result.data).toMatchObject({ _transforms: null, focalX: null, focalY: null })
    })

    it('should keep query focal overrides out of persisted state', async () => {
      const result = await generateFileData({
        collection: createCollection({ focalPoint: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createPngReq({ query: { uploadEdits: { focalPoint: { x: 20.4, y: 80.6 } } } }),
      })

      expect(result.data).toMatchObject({ _transforms: null, focalX: null, focalY: null })
    })

    it('should not save a focal point when focalPoint is disabled', async () => {
      const result = await generateFileData({
        collection: createCollection({ focalPoint: false }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createPngReq(),
      })

      expect(result.data).toMatchObject({ _transforms: null, focalX: null, focalY: null })
    })
  })

  it('uses the inspected non-image type for image processing', async () => {
    const { sharp } = createSharpMock()
    const fileContent = Buffer.from(
      '<?xml version="1.0"?><document><title>Reference</title></document>',
    )
    const req = {
      file: {
        data: fileContent,
        mimetype: 'image/avif',
        name: 'reference.avif',
        size: fileContent.length,
      },
      payload: {
        config: { sharp },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(sharp).not.toHaveBeenCalled()
    expect(result.data).toMatchObject({ mimeType: 'application/xml' })
  })

  it('handles inspected SVG dimensions and crop edits without image processing', async () => {
    const { sharp } = createSharpMock()
    const fileContent = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
    )
    const req = {
      file: {
        data: fileContent,
        mimetype: 'image/avif',
        name: 'reference.avif',
        size: fileContent.length,
      },
      payload: {
        config: { sharp },
        logger: { error: vi.fn() },
      },
      query: {
        uploadEdits: {
          crop: { x: 0, y: 0 },
          heightInPixels: 2,
          widthInPixels: 2,
        },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(sharp).not.toHaveBeenCalled()
    expect(result.data).toMatchObject({ height: 1, mimeType: 'image/svg+xml', width: 1 })
  })

  it('does not overwrite req.file with a truncated header-only buffer', async () => {
    // Mirrors what `getFileFromUploadInstructions` returns for the `'header'` content
    // requirement: only the first bytes of the file, alongside the real, full declared size.
    const truncatedBuffer = PNG_SIGNATURE
    const fullFileSize = 5_000_000
    const { sharp } = createSharpMock()

    const req = {
      file: {
        data: truncatedBuffer,
        mimetype: 'image/png',
        name: 'photo.png',
        size: fullFileSize,
        uploadReference: { prefix: 'media' },
      },
      payload: {
        config: { sharp },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    await generateFileData({
      collection: createCollection({ variants: [] }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(req.file?.size).toBe(fullFileSize)
    expect(req.file?.data).toBe(truncatedBuffer)
    expect(sharp).not.toHaveBeenCalled()
  })

  it('does not process a header-only upload after detecting an animated image type', async () => {
    const fullFileSize = 5_000_000
    const { sharp } = createSharpMock()
    const req = {
      file: {
        data: GIF_SIGNATURE,
        mimetype: 'image/png',
        name: 'photo.png',
        size: fullFileSize,
        uploadReference: { key: 'media/photo.png' },
      },
      payload: {
        config: { sharp },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(sharp).not.toHaveBeenCalled()
    expect(result.data).toMatchObject({ height: 1, mimeType: 'image/gif', width: 1 })
  })

  it('copies straight from the temp file instead of reading it into memory when local storage is enabled', async () => {
    const req = {
      file: {
        data: Buffer.alloc(0),
        mimetype: 'application/pdf',
        name: 'document.pdf',
        size: PNG_SIGNATURE.length,
        tempFilePath,
      },
      payload: {
        collections: { media: { config: { fields: [], upload: {} } } },
        config: { routes: { api: '/api' }, sharp: undefined },
        db: { findOne: vi.fn(async () => null) },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const { files } = await generateFileData({
      collection: createCollection({ disableLocalStorage: false }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(files).toEqual([
      {
        path: `${os.tmpdir()}/document-original.pdf`,
        sourcePath: tempFilePath,
      },
    ])
  })

  it('does not save anything when local storage is disabled and no processing is needed', async () => {
    const req = {
      file: {
        data: Buffer.alloc(0),
        mimetype: 'application/pdf',
        name: 'document.pdf',
        size: PNG_SIGNATURE.length,
        tempFilePath,
      },
      payload: {
        config: { sharp: undefined },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const { files } = await generateFileData({
      collection: createCollection({ disableLocalStorage: true }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(files).toEqual([])
  })
})

describe('post-transform validation', () => {
  it('should pass the nearest block and final document context through nested containers', async () => {
    const observations: Record<string, unknown>[] = []
    const validate: Validate = (value, args) => {
      observations.push({
        blockType: args.blockData?.blockType,
        data: args.data,
        operation: args.operation,
        overrideAccess: args.overrideAccess,
        path: args.path,
        previousValue: args.previousValue,
        siblingData: args.siblingData,
        value,
      })
      return true
    }
    const fields: Field[] = [
      { name: 'title', type: 'text', validate },
      {
        name: 'sections',
        type: 'blocks',
        blocks: [
          {
            slug: 'outer',
            fields: [
              {
                name: 'details',
                type: 'group',
                fields: [
                  {
                    name: 'rows',
                    type: 'array',
                    fields: [{ name: 'value', type: 'text', validate }],
                  },
                ],
              },
              {
                name: 'nested',
                type: 'blocks',
                blocks: [
                  {
                    slug: 'inner',
                    fields: [{ name: 'value', type: 'text', validate }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
    const doc = {
      title: 'after',
      sections: [
        {
          blockType: 'outer',
          details: { rows: [{ value: 'after' }] },
          nested: [{ blockType: 'inner', value: 'after' }],
        },
      ],
    }
    const originalDoc = structuredClone(doc)
    originalDoc.title = 'before'
    originalDoc.sections[0].details.rows[0].value = 'before'
    originalDoc.sections[0].nested[0].value = 'before'

    await validateTransformedDocument({
      collection: { ...createCollection().config, fields },
      doc,
      originalDoc,
      operation: 'update',
      overrideAccess: true,
      req: { payload: { config: {} } } as PayloadRequest,
    })

    expect(observations).toEqual([
      expect.objectContaining({ blockType: undefined, path: ['title'], siblingData: doc }),
      expect.objectContaining({
        blockType: 'outer',
        path: ['sections', 0, 'details', 'rows', 0, 'value'],
        siblingData: { value: 'after' },
      }),
      expect.objectContaining({
        blockType: 'inner',
        path: ['sections', 0, 'nested', 0, 'value'],
        siblingData: { blockType: 'inner', value: 'after' },
      }),
    ])
    for (const observation of observations) {
      expect(observation).toMatchObject({
        data: doc,
        operation: 'update',
        overrideAccess: true,
        previousValue: 'before',
        value: 'after',
      })
    }
  })

  it('should validate localized mutations with the corresponding locale and previous value', async () => {
    const observations: unknown[] = []
    const validate: Validate = (value, { previousValue, req }) => {
      observations.push({
        fallbackLocale: req.fallbackLocale,
        locale: req.locale,
        previousValue,
        value,
      })
      return true
    }

    await validateTransformedDocument({
      collection: {
        ...createCollection().config,
        fields: [{ name: 'title', type: 'text', localized: true, validate }],
      },
      doc: { title: { en: 'after-en', de: 'after-de' } },
      originalDoc: { title: { en: 'before-en', de: 'before-de' } },
      operation: 'update',
      req: {
        payload: { config: { localization: { localeCodes: ['en', 'de'] } } },
      } as PayloadRequest,
    })

    expect(observations).toEqual([
      { fallbackLocale: null, locale: 'en', previousValue: 'before-en', value: 'after-en' },
      { fallbackLocale: null, locale: 'de', previousValue: 'before-de', value: 'after-de' },
    ])
  })
})
