import type { R2StorageOptions } from '@payloadcms/storage-r2'

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getPlatformProxy } from 'wrangler'

import { createR2Adapter } from '../../packages/storage-r2/src/adapter.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('R2 temporary file uploads', () => {
  it('should upload temporary file bytes to a real R2 binding', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'payload-r2-temp-'))
    const environment = await getPlatformProxy<{ R2: R2StorageOptions['bucket'] }>({
      configPath: path.resolve(dirname, '../storage-r2/wrangler.jsonc'),
      persist: false,
    }).catch(async (error) => {
      await rm(directory, { force: true, recursive: true })
      throw error
    })
    const bytes = Buffer.from('processed temporary file contents')
    const tempFilePath = path.join(directory, 'processed.png')
    const storageFilePath = 'client-upload/processed.png'
    const adapter = createR2Adapter({
      bucket: environment.env.R2,
      clientUploads: true,
      collections: {},
    })({ collection: { slug: 'media' } } as never)

    try {
      await writeFile(tempFilePath, bytes)
      await adapter.handleUpload({
        data: { filename: 'processed.png' },
        file: {
          buffer: Buffer.alloc(0),
          clientUpload: { isProcessed: true, originalStorageFilePath: storageFilePath },
          filename: 'processed.png',
          filesize: bytes.length,
          mimeType: 'image/png',
          tempFilePath,
        },
        storageFilePath,
      } as never)

      const stored = await environment.env.R2.get(storageFilePath)

      expect(stored?.httpMetadata?.contentType).toBe('image/png')
      expect(Buffer.from(await stored!.arrayBuffer())).toEqual(bytes)
    } finally {
      try {
        await environment.env.R2.delete(storageFilePath)
      } finally {
        await environment.dispose()
        await rm(directory, { force: true, recursive: true })
      }
    }
  })
})
