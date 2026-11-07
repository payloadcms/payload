import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

import { generateFileData } from './generateFileData.js'

// A minimal valid 1x1 transparent PNG, so `file-type` can detect `image/png` from it.
const PNG_SIGNATURE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
)

const GIF_SIGNATURE = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

// A real MP4, sniffed as `video/mp4` by `file-type`. Used to prove that a
// wrongly-declared `file.mimetype` on a video is corrected to the type that was
// actually detected from the buffer.
const MP4_FILE_PATH = path.resolve(
  dirname,
  '../../../../test/uploads/christmas-mariachi-in-guadalajara.mp4',
)

// A minimal WebM container. `file-type` sniffs any WebM (audio or video) as
// `video/webm` because it does not read track data. Used to prove that an
// explicit `audio/webm` declaration is preserved and not overwritten.
// prettier-ignore
const WEBM_SIGNATURE = Buffer.from([
  0x1a, 0x45, 0xdf, 0xa3, 0x9f, // EBML header
  0x42, 0x86, 0x81, 0x01, // EBMLVersion = 1
  0x42, 0xf7, 0x81, 0x01, // EBMLReadVersion = 1
  0x42, 0xf2, 0x81, 0x04, // EBMLMaxIDLength = 4
  0x42, 0xf3, 0x81, 0x08, // EBMLMaxSizeLength = 8
  0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, // DocType = "webm"
  0x42, 0x87, 0x81, 0x04, // DocTypeVersion = 4
  0x42, 0x85, 0x81, 0x02, // DocTypeReadVersion = 2
])

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

    it('should default the focal point to the center on create', async () => {
      const result = await generateFileData({
        collection: createCollection({ focalPoint: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createPngReq(),
      })

      expect(result.data).toMatchObject({ focalX: 50, focalY: 50 })
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

  it('corrects a wrongly-declared mimetype on a video to the detected type', async () => {
    // The video is shipped with an incorrect `application/octet-stream`
    // Content-Type, but its bytes are a real MP4.
    const fileContent = readFileSync(MP4_FILE_PATH)
    const req = {
      file: {
        data: fileContent,
        mimetype: 'application/octet-stream',
        name: 'video.mp4',
        size: fileContent.length,
      },
      payload: {
        config: { sharp: undefined },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection({ disableLocalStorage: true, mimeTypes: ['video/*'] }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(result.data).toMatchObject({ mimeType: 'video/mp4' })
    // `file.mimetype` correction must be reflected on `req.file.mimetype` too, so
    // hooks/plugins reading it observe the corrected type.
    expect(req.file?.mimetype).toBe('video/mp4')
  })

  it('does not replace a declared audio/webm with video/webm', async () => {
    // `file-type` identifies any WebM container (audio or video) as `video/webm`
    // because it does not read track data. An explicit `audio/webm` declaration
    // must be preserved rather than overwritten with a wrong `video/webm`.
    const req = {
      file: {
        data: WEBM_SIGNATURE,
        mimetype: 'audio/webm',
        name: 'audio.webm',
        size: WEBM_SIGNATURE.length,
      },
      payload: {
        config: { sharp: undefined },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection({ disableLocalStorage: true }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(result.data).toMatchObject({ mimeType: 'audio/webm' })
  })

  it('does not replace a parameterized audio/webm declaration with video/webm', async () => {
    // A parameterized declaration such as `audio/webm;codecs=opus` must be
    // treated like `audio/webm` (compared on the MIME essence) and preserved
    // rather than overwritten with a wrong `video/webm`.
    const req = {
      file: {
        data: WEBM_SIGNATURE,
        mimetype: 'audio/webm;codecs=opus',
        name: 'audio.webm',
        size: WEBM_SIGNATURE.length,
      },
      payload: {
        config: { sharp: undefined },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection({ disableLocalStorage: true }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(result.data).toMatchObject({ mimeType: 'audio/webm;codecs=opus' })
  })

  it('preserves caller media parameters when the detected mime essence matches', async () => {
    // A declaration like `video/mp4;codecs=avc1` shares its essence with the
    // detected `video/mp4`. The correction must not fire, so the `codecs`
    // parameter is retained in stored metadata and `req.file.mimetype`.
    const fileContent = readFileSync(MP4_FILE_PATH)
    const req = {
      file: {
        data: fileContent,
        mimetype: 'video/mp4;codecs=avc1',
        name: 'video.mp4',
        size: fileContent.length,
      },
      payload: {
        config: { sharp: undefined },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest

    const result = await generateFileData({
      collection: createCollection({ disableLocalStorage: true, mimeTypes: ['video/*'] }),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(result.data).toMatchObject({ mimeType: 'video/mp4;codecs=avc1' })
    expect(req.file?.mimetype).toBe('video/mp4;codecs=avc1')
  })
})
