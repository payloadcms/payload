import { randomUUID } from 'crypto'
import { rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import {
  CLIENT_UPLOAD_CONTEXT_CONTEXT_KEY,
  CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY,
} from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createUploadthingAdapter } from './adapter.js'

describe('handleUpload', () => {
  const bytes = Buffer.from('processed image contents')
  let tempFilePath: string
  let storedFile: File | undefined
  const utApi = {
    deleteFiles: vi.fn(),
    uploadFiles: vi.fn((file: File) => {
      storedFile = file
      return { data: { name: file.name, key: 'stored-key' } } as object
    }),
  }
  const payload = { logger: { error: vi.fn() } }
  const adapter = createUploadthingAdapter({ acl: 'public-read', utApi: utApi as never })({
    collection: { slug: 'media' },
  } as never)

  beforeEach(async () => {
    tempFilePath = path.join(tmpdir(), `uploadthing-upload-${randomUUID()}`)
    await writeFile(tempFilePath, bytes)
  })

  afterEach(async () => {
    await rm(tempFilePath, { force: true })
    storedFile = undefined
    utApi.deleteFiles.mockClear()
  })

  it('should upload the temporary file contents', async () => {
    await adapter.handleUpload({
      data: {},
      file: {
        buffer: Buffer.alloc(0),
        filename: 'processed.png',
        mimeType: 'image/png',
        tempFilePath,
      },
      req: { context: {}, payload },
      storageFilePath: 'processed.png',
    } as never)

    expect(Buffer.from(await storedFile!.arrayBuffer())).toEqual(bytes)
  })

  it('should delete the browser upload when a processed client upload replaces it', async () => {
    await adapter.handleUpload({
      data: {},
      file: {
        buffer: Buffer.alloc(0),
        filename: 'processed.png',
        mimeType: 'image/png',
        tempFilePath,
      },
      req: {
        payload,
        context: {
          [CLIENT_UPLOAD_CONTEXT_CONTEXT_KEY]: { key: 'browser-key' },
          [CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]: tempFilePath,
        },
      },
      storageFilePath: 'processed.png',
    } as never)

    expect(utApi.deleteFiles).toHaveBeenCalledWith('browser-key')
  })

  it('should not delete the browser upload when uploading an image size', async () => {
    await adapter.handleUpload({
      data: { sizes: { square: { filename: 'processed-400x400.png' } } },
      file: {
        buffer: Buffer.from('image size contents'),
        filename: 'processed-400x400.png',
        imageSizeName: 'square',
        mimeType: 'image/png',
      },
      req: {
        payload,
        context: {
          [CLIENT_UPLOAD_CONTEXT_CONTEXT_KEY]: { key: 'browser-key' },
          [CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]: tempFilePath,
        },
      },
      storageFilePath: 'processed-400x400.png',
    } as never)

    expect(utApi.deleteFiles).not.toHaveBeenCalled()
  })

  it('should keep the browser upload when the processed file fails to upload', async () => {
    utApi.uploadFiles.mockReturnValueOnce({ error: { code: 'UPLOAD_FAILED', message: 'failed' } })

    await expect(
      adapter.handleUpload({
        data: {},
        file: {
          buffer: Buffer.alloc(0),
          filename: 'processed.png',
          mimeType: 'image/png',
          tempFilePath,
        },
        req: {
          payload,
          context: {
            [CLIENT_UPLOAD_CONTEXT_CONTEXT_KEY]: { key: 'browser-key' },
            [CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]: tempFilePath,
          },
        },
        storageFilePath: 'processed.png',
      } as never),
    ).rejects.toThrow('Error uploading file')

    expect(utApi.deleteFiles).not.toHaveBeenCalled()
  })
})
