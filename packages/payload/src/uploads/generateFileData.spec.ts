import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateFileData } from './generateFileData.js'

// A minimal valid 1x1 transparent PNG, so `file-type` can detect `image/png` from it.
const PNG_SIGNATURE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
)

// A minimal valid 1x1 lossy WebP, so `file-type` can detect `image/webp` from it.
const WEBP_SIGNATURE = Buffer.from(
  'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
  'base64',
)

// Minimal valid 1x1 single-frame GIF and TIFF, for the same reason.
const GIF_SIGNATURE = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)
const TIFF_SIGNATURE = Buffer.from(
  'SUkqAAwAAAAAAAAADwAAAQMAAQAAAAEAAAABAQMAAQAAAAEAAAACAQMAAwAAANYAAAADAQMAAQAAAAEAAAAGAQMAAQAAAAIAAAARAQQAAQAAAAgAAAASAQMAAQAAAAEAAAAVAQMAAQAAAAMAAAAWAQMAAQAAAAABAAAXAQQAAQAAAAMAAAAaAQUAAQAAAMYAAAAbAQUAAQAAAM4AAAAcAQMAAQAAAAEAAAAoAQMAAQAAAAIAAABTAQMAAwAAANwAAAAAAAAAMzPLAAAACAAzM8sAAAAIAAgACAAIAAEAAQABAA==',
  'base64',
)

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

  return { metadataMock, sharp, toBufferMock }
}

const createCollection = (uploadOverrides: Record<string, unknown> = {}): Collection =>
  ({
    config: {
      slug: 'media',
      upload: {
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

  describe('when local storage is disabled', () => {
    it('does not run full sharp processing on an image with no configured adjustments, even when it arrives via tempFilePath', async () => {
      const { sharp, toBufferMock } = createSharpMock()

      await generateFileData({
        collection: createCollection({ disableLocalStorage: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createReq(sharp),
      })

      expect(toBufferMock).not.toHaveBeenCalled()
    })

    it('does not save anything when no processing is needed', async () => {
      const { sharp } = createSharpMock()

      const { files } = await generateFileData({
        collection: createCollection({ disableLocalStorage: true }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createReq(sharp),
      })

      expect(files).toEqual([])
    })

    it('still runs sharp processing when resize options are configured', async () => {
      const { sharp, toBufferMock } = createSharpMock()

      await generateFileData({
        collection: createCollection({ disableLocalStorage: true, resizeOptions: { width: 100 } }),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createReq(sharp),
      })

      expect(toBufferMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when local storage is enabled (default)', () => {
    it('copies straight from the temp file instead of running sharp processing, when no adjustments are configured', async () => {
      const { sharp, toBufferMock } = createSharpMock()

      const { files } = await generateFileData({
        collection: createCollection(),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createReq(sharp),
      })

      expect(toBufferMock).not.toHaveBeenCalled()
      expect(files).toEqual([{ path: `${os.tmpdir()}/photo.png`, sourcePath: tempFilePath }])
    })
  })

  describe('when the mime type can be animated (WebP, GIF, TIFF)', () => {
    const createReqFor = ({
      data,
      mimetype,
      name,
      sharp,
      tempFilePath = '',
    }: {
      data: Buffer
      mimetype: string
      name: string
      sharp: unknown
      tempFilePath?: string
    }): PayloadRequest =>
      ({
        file: {
          data: tempFilePath ? Buffer.alloc(0) : data,
          mimetype,
          name,
          size: data.length,
          tempFilePath,
        },
        payload: {
          config: { sharp },
          logger: { error: vi.fn() },
        },
      }) as unknown as PayloadRequest

    const createWebpReq = (sharp: unknown): PayloadRequest =>
      createReqFor({ name: 'photo.webp', data: WEBP_SIGNATURE, mimetype: 'image/webp', sharp })

    it.each([
      { name: 'photo.webp', data: WEBP_SIGNATURE, mimetype: 'image/webp' },
      { name: 'photo.gif', data: GIF_SIGNATURE, mimetype: 'image/gif' },
      { name: 'photo.tiff', data: TIFF_SIGNATURE, mimetype: 'image/tiff' },
    ])(
      'should store a single-frame $mimetype untouched instead of re-encoding it',
      async ({ name, data: fileBytes, mimetype }) => {
        const { sharp, toBufferMock } = createSharpMock()

        const { data, files } = await generateFileData({
          collection: createCollection(),
          config: {} as SanitizedConfig,
          data: {},
          operation: 'create',
          overwriteExistingFiles: true,
          req: createReqFor({ name, data: fileBytes, mimetype, sharp }),
        })

        expect(toBufferMock).not.toHaveBeenCalled()
        expect(files).toEqual([{ buffer: fileBytes, path: `${os.tmpdir()}/${name}` }])
        expect(data).toMatchObject({ filesize: fileBytes.length, mimeType: mimetype })
      },
    )

    it('should read the frame count from tempFilePath and copy the single-frame file untouched', async () => {
      const { sharp, toBufferMock } = createSharpMock()
      await fs.writeFile(tempFilePath, WEBP_SIGNATURE)

      const { files } = await generateFileData({
        collection: createCollection(),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createReqFor({
          name: 'photo.webp',
          data: WEBP_SIGNATURE,
          mimetype: 'image/webp',
          sharp,
          tempFilePath,
        }),
      })

      expect(sharp).toHaveBeenCalledWith(tempFilePath)
      expect(toBufferMock).not.toHaveBeenCalled()
      expect(files).toEqual([{ path: `${os.tmpdir()}/photo.webp`, sourcePath: tempFilePath }])
    })

    it('should still process an animated image with sharp', async () => {
      const { metadataMock, sharp, toBufferMock } = createSharpMock()
      metadataMock.mockResolvedValue({ height: 3, pages: 3, width: 1 })

      await generateFileData({
        collection: createCollection(),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createWebpReq(sharp),
      })

      expect(toBufferMock).toHaveBeenCalledTimes(1)
      expect(sharp).toHaveBeenCalledWith(
        WEBP_SIGNATURE,
        expect.objectContaining({ animated: true }),
      )
    })

    it('should keep the existing behavior when sharp cannot read the frame count', async () => {
      const { metadataMock, sharp, toBufferMock } = createSharpMock()
      metadataMock.mockRejectedValueOnce(new Error('unsupported image format'))

      await generateFileData({
        collection: createCollection(),
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req: createWebpReq(sharp),
      })

      expect(toBufferMock).toHaveBeenCalledTimes(1)
    })
  })
})
