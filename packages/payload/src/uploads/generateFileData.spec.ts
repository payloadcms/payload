import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { UploadTransformer } from './transformers/types.js'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APIError } from '../errors/APIError.js'
import { FileUploadError } from '../errors/index.js'
import { deepCopyObject } from '../utilities/deepCopyObject.js'
import { generateFileData } from './generateFileData.js'
import { uploadTransformerInternal } from './transformers/uploadTransformerBridge.js'

vi.mock('../utilities/deepCopyObject.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utilities/deepCopyObject.js')>()

  return { ...original, deepCopyObject: vi.fn(original.deepCopyObject) }
})

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

  it('should not copy the document when no transformers are configured', async () => {
    const { sharp } = createSharpMock()
    vi.mocked(deepCopyObject).mockClear()

    await generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: { alt: 'photo' },
      operation: 'create',
      overwriteExistingFiles: true,
      req: createReq(sharp),
    })

    expect(deepCopyObject).not.toHaveBeenCalled()
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
          logger: { error: vi.fn(), warn: vi.fn() },
        },
        query,
      }) as unknown as PayloadRequest

    it('should default the focal point to the center on create, without a crop warning', async () => {
      const req = createPngReq()

      const result = await generateFileData({
        collection: createCollection({ focalPoint: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req,
      })

      expect(result.data).toMatchObject({ focalX: 50, focalY: 50 })
      expect(req.payload.logger.warn).not.toHaveBeenCalled()
    })

    it('should save a focal point sent through the uploadEdits query param', async () => {
      const result = await generateFileData({
        collection: createCollection({ focalPoint: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createPngReq({ query: { uploadEdits: { focalPoint: { x: 20.4, y: 80.6 } } } }),
      })

      expect(result.data).toMatchObject({ focalX: 20, focalY: 81 })
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

      expect(result.data).not.toHaveProperty('focalX')
    })
  })

  it('should preserve the declared stylesheet type and original contents', async () => {
    const fileContent = Buffer.from(
      '<?xml version="1.0"?><document><title>Reference</title></document>',
    )
    const req = {
      file: {
        data: fileContent,
        mimetype: 'text/xsl',
        name: 'reference.xsl',
        size: fileContent.length,
      },
      payload: { config: {}, logger: { error: vi.fn() } },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(result.data).toMatchObject({ mimeType: 'text/xsl' })
    expect(req.file?.data).toEqual(fileContent)
    expect(result.files).toEqual([
      {
        buffer: fileContent,
        path: path.join(os.tmpdir(), 'reference.xsl'),
        role: { type: 'default' },
      },
    ])
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

  it('handles inspected SVG dimensions without image processing', async () => {
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
        logger: { error: vi.fn(), warn: vi.fn() },
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
        path: `${os.tmpdir()}/document.pdf`,
        role: { type: 'default' },
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

// `test/storage-azure/client-uploads` covers the download counts against real storage.
describe('generateFileData - client uploads without full contents', () => {
  /** Starts from the file that `getFileFromUploadInstructions` returns for a 'none' requirement. */
  const runClientUpload = ({
    fetchFullClientUpload,
    size,
    transformFile,
  }: Pick<UploadTransformer, 'transformFile'> &
    Required<Pick<Parameters<typeof generateFileData>[0], 'fetchFullClientUpload'>> & {
      size: number
    }) =>
    generateFileData({
      collection: createCollection(),
      config: {} as SanitizedConfig,
      data: {},
      fetchFullClientUpload,
      operation: 'create',
      req: {
        context: {},
        file: {
          data: Buffer.alloc(0),
          mimetype: 'video/mp4',
          name: 'clip.mp4',
          size,
          uploadReference: { prefix: '' },
        },
        payload: {
          collections: { media: { config: { fields: [], upload: {} } } },
          config: {
            routes: { api: '/api' },
            upload: {
              transformers: [{ slug: 'accepting', mimeTypes: ['video/*'], transformFile }],
            },
          },
          db: { findOne: vi.fn(async () => null) },
          logger: { error: vi.fn(), warn: vi.fn() },
        },
      } as unknown as PayloadRequest,
    })

  it('should run the content checks on the downloaded file before transformers get it', async () => {
    const malformedMedia = Buffer.concat([
      Buffer.alloc(4),
      Buffer.from('ftypavif'),
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
    ])
    const transformFile = vi.fn()

    await expect(
      runClientUpload({
        fetchFullClientUpload: async ({ file }) => ({ ...file, data: malformedMedia }),
        size: malformedMedia.length,
        transformFile,
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ message: 'Invalid or corrupted ISO base media file.' }] },
    })
    expect(transformFile).not.toHaveBeenCalled()
  })

  it('should keep the message and status of an error from the download', async () => {
    const error = new APIError('Uploaded source size does not match the declared size.', 400)

    await expect(
      runClientUpload({
        fetchFullClientUpload: () => Promise.reject(error),
        size: 1,
        transformFile: vi.fn(),
      }),
    ).rejects.toMatchObject({ message: error.message, status: 400 })
  })
})

describe('generateFileData - _transforms claims', () => {
  const crop = { height: 1, width: 1, x: 0, y: 0 }
  const focalPoint = { x: 20, y: 80 }
  // A cropped upload: its main file is the crop of a 10x10 original.
  const croppedDoc = {
    _transforms: { crop },
    mimeType: 'image/png',
    original: { filename: 'photo.png', height: 10, mimeType: 'image/png', width: 10 },
  }
  // A client upload that arrived with only its header.
  const headerOnlyFile = { data: PNG_SIGNATURE, mimetype: 'image/png', name: 'photo.png' }
  const stage = (canTransform: UploadTransformer['canTransform'], internal = {}) => ({
    slug: 'stage',
    canTransform,
    mimeTypes: ['image/*'],
    transformFile: vi.fn(),
    ...internal,
  })
  const claim = (keys: string[]) => () => ({ canTransform: true, handledTransformKeys: keys })
  const fetchFullClientUpload = vi.fn()
  const logError = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  type RunArgs = { data: object; file?: object; originalDoc?: object; transformers?: object[] }

  const run = ({ data, file, originalDoc, transformers = [] }: RunArgs) =>
    generateFileData({
      collection: createCollection({ focalPoint: true }),
      config: {} as SanitizedConfig,
      data,
      fetchFullClientUpload,
      operation: originalDoc ? 'update' : 'create',
      originalDoc,
      overwriteExistingFiles: true,
      req: {
        file: file && { ...file, size: 5_000_000, uploadReference: { key: 'media/photo.png' } },
        payload: { config: { upload: { transformers } }, logger: { error: logError } },
        query: {},
        t: (key: string) => key,
      } as unknown as PayloadRequest,
    })

  it.for([
    {
      name: 'a focal point rebuild that would drop a saved crop no stage claims',
      data: { focalX: 20, focalY: 80 },
      originalDoc: croppedDoc,
      transformers: [stage(claim(['focalPoint']))],
    },
    {
      name: 'a saved crop no stage claims on a header-only client upload, before downloading it',
      data: { _transforms: { crop } },
      file: headerOnlyFile,
      transformers: [stage(() => true)],
    },
  ])('should reject $name', async (args) => {
    await expect(run(args)).rejects.toMatchObject({
      data: { errors: [{ path: '_transforms.crop' }] },
    })
    expect(fetchFullClientUpload).not.toHaveBeenCalled()
  })

  it('should save a focal point change on a document whose saved crop no stage claims', async () => {
    const { data } = await run({ data: { focalX: 20, focalY: 80 }, originalDoc: croppedDoc })

    expect(data).toMatchObject({ _transforms: { crop, focalPoint }, focalX: 20, focalY: 80 })
  })

  it('should not download a header-only client upload for a focal point alone', async () => {
    const prepareUpload = vi.fn()
    const sharp = stage(claim(['crop', 'focalPoint']), {
      [uploadTransformerInternal]: { prepareUpload },
    })

    await run({
      data: { _transforms: { focalPoint } },
      file: headerOnlyFile,
      transformers: [sharp],
    })

    expect(fetchFullClientUpload).not.toHaveBeenCalled()
    expect(prepareUpload).not.toHaveBeenCalled()
  })

  it('should log a canTransform error during rebuild planning and throw a FileUploadError', async () => {
    const failure = new Error('canTransform failed')
    const throwing = stage(() => {
      throw failure
    })

    await expect(
      run({
        data: { _transforms: { crop, watermark: 'draft' } },
        originalDoc: croppedDoc,
        transformers: [throwing],
      }),
    ).rejects.toThrow(FileUploadError)
    expect(logError).toHaveBeenCalledWith(failure)
  })

  it('should reject a key that only a request-time stage claims when no original is stored', async () => {
    const requestOnlyStage = {
      slug: 'request-crop',
      canTransform: () => ({ canTransform: true, handledTransformKeys: ['crop'] }),
      handleRequest: vi.fn(),
      mimeTypes: ['image/*'],
    }

    await expect(
      generateFileData({
        collection: createCollection(),
        config: {} as SanitizedConfig,
        data: { _transforms: { crop: { height: 1, width: 1, x: 0, y: 0 } } },
        operation: 'create',
        overwriteExistingFiles: true,
        req: {
          file: {
            data: PNG_SIGNATURE,
            mimetype: 'image/png',
            name: 'photo.png',
            size: PNG_SIGNATURE.length,
          },
          payload: {
            config: { upload: { transformers: [requestOnlyStage] } },
            logger: { error: vi.fn(), warn: vi.fn() },
          },
        } as unknown as PayloadRequest,
      }),
    ).rejects.toMatchObject({ data: { errors: [{ path: '_transforms.crop' }] } })
  })
})

describe('generateFileData - filename errors', () => {
  const createFilenameReq = ({
    filename,
    hasCollision = false,
    transformers = [],
  }: {
    filename: string
    hasCollision?: boolean
    transformers?: UploadTransformer[]
  }): PayloadRequest =>
    ({
      file: {
        data: Buffer.from('plain text contents'),
        mimetype: 'text/plain',
        name: filename,
        size: 19,
      },
      payload: {
        collections: { media: { config: { fields: [], upload: {} } } },
        config: { routes: { api: '/api' }, upload: { transformers } },
        db: { findOne: vi.fn().mockResolvedValue(hasCollision ? { id: 'existing' } : null) },
        logger: { error: vi.fn() },
      },
    }) as unknown as PayloadRequest

  const run = ({ req }: { req: PayloadRequest }) =>
    generateFileData({
      collection: createCollection({ disableLocalStorage: false }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      req,
    })

  it('should preserve the message and 400 status for an overlong extension', async () => {
    const req = createFilenameReq({ filename: `a.${'é'.repeat(128)}` })

    await expect(run({ req })).rejects.toMatchObject({
      message: 'Upload filename extension exceeds the filename byte limit',
      status: 400,
    })
  })

  it.each([
    ['suffix overflow', `a.${'x'.repeat(253)}`],
    ['persistent collisions', 'photo.txt'],
  ])('should preserve the message and 409 status for %s', async (_, filename) => {
    const req = createFilenameReq({ filename, hasCollision: true })

    await expect(run({ req })).rejects.toMatchObject({
      message: 'Unable to find an available upload filename',
      status: 409,
    })
  })

  it('should keep wrapping unrelated transformer API errors as upload failures', async () => {
    const failure = new APIError('Private transformer failure', 409)
    const req = createFilenameReq({
      filename: 'photo.txt',
      transformers: [
        {
          slug: 'failing',
          mimeTypes: ['text/plain'],
          transformFile: () => {
            throw failure
          },
        },
      ],
    })

    await expect(run({ req })).rejects.toMatchObject({
      name: 'FileUploadError',
      status: 400,
    })
    expect(req.payload.logger.error).toHaveBeenCalledWith(failure)
  })
})
