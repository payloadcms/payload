import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { expect, it, vi } from 'vitest'

import { generateFileData } from './generateFileData.js'

it.each([
  { hasTempFile: true, mode: 'mime' },
  { hasTempFile: false, mode: 'mime' },
  { hasTempFile: true, mode: 'format' },
  { hasTempFile: false, mode: 'format' },
  { hasTempFile: true, mode: 'crop' },
  { hasTempFile: false, mode: 'crop' },
])(
  'should synchronize $mode client processing (temp: $hasTempFile)',
  async ({ hasTempFile, mode }) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'payload-client-state-'))

    try {
      const source = await sharp({
        create: { background: '#336699', channels: 3, height: 80, width: 120 },
      })
        .png()
        .toBuffer()
      const tempFilePath = hasTempFile ? path.join(directory, 'source.png') : undefined

      if (tempFilePath) {
        await writeFile(tempFilePath, source)
      }

      const req = {
        file: {
          clientUpload: { isProcessed: false, originalStorageFilePath: 'issued-key/image.png' },
          data: hasTempFile ? Buffer.alloc(0) : source,
          mimetype: mode === 'mime' ? 'image/jpeg' : 'image/png',
          name: 'image.png',
          size: source.length,
          tempFilePath,
          clientUploadContext: { signedReceipt: 'verified-receipt' },
        },
        payload: { config: { sharp }, logger: { error: vi.fn() } },
        query:
          mode === 'crop'
            ? {
                uploadEdits: {
                  crop: { height: 50, width: 50, unit: '%', x: 0, y: 0 },
                  heightInPixels: 40,
                  widthInPixels: 60,
                },
              }
            : {},
      } as unknown as PayloadRequest
      const collection = {
        config: {
          slug: 'media',
          upload: {
            disableLocalStorage: true,
            focalPoint: false,
            staticDir: directory,
            ...(mode === 'format'
              ? { formatOptions: { format: 'webp' } }
              : { resizeOptions: { height: 20, width: 30 } }),
          },
        },
      } as unknown as Collection
      const { data } = await generateFileData({
        collection,
        config: {} as SanitizedConfig,
        data: {},
        operation: 'create',
        overwriteExistingFiles: true,
        req,
      })
      const metadata = data as {
        filename: string
        mimeType: string
        filesize: number
        height: number
        width: number
      }
      const bytes = tempFilePath ? await readFile(tempFilePath) : req.file!.data

      expect(req.file).toMatchObject({
        clientUpload: { isProcessed: true, originalStorageFilePath: 'issued-key/image.png' },
        mimetype: metadata.mimeType,
        name: metadata.filename,
        size: metadata.filesize,
      })
      expect(req.file!.clientUploadContext).toBeUndefined()
      expect(bytes.length).toBe(metadata.filesize)
      expect(await sharp(bytes).metadata()).toMatchObject({
        format: mode === 'format' ? 'webp' : 'png',
        height: mode === 'format' ? 80 : 20,
        width: mode === 'format' ? 120 : 30,
      })
      if (hasTempFile) {
        expect(req.file!.data.length).toBe(0)
      }
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  },
)
