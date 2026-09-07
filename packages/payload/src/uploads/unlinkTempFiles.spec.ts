import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY } from './getFileFromClientUpload.js'
import { unlinkTempFiles } from './unlinkTempFiles.js'

const createTempFile = async (contents = 'temp-file-contents'): Promise<string> => {
  const tempFilePath = path.join(
    os.tmpdir(),
    `unlink-temp-files-spec-${Date.now()}-${Math.random()}`,
  )
  await fs.writeFile(tempFilePath, contents)
  return tempFilePath
}

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const collectionConfig = {
  upload: { disableLocalStorage: true },
} as unknown as SanitizedCollectionConfig

describe('unlinkTempFiles', () => {
  const tempFilesToRemove: string[] = []

  afterEach(async () => {
    for (const tempFilePath of tempFilesToRemove) {
      await fs.rm(tempFilePath, { force: true })
    }
    tempFilesToRemove.length = 0
  })

  it('removes a client-upload materialized temp file even when useTempFiles is false', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    const req = {
      file: {
        clientUploadContext: undefined,
        data: Buffer.alloc(0),
        mimetype: 'video/mp4',
        name: 'clip.mp4',
        size: 10,
        tempFilePath,
      },
    } as unknown as PayloadRequest

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: false } } as unknown as SanitizedConfig,
      req,
    })

    expect(await fileExists(tempFilePath)).toBe(false)
  })

  it('leaves a local-API temp file alone when useTempFiles is false', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    const req = {
      file: {
        data: Buffer.alloc(0),
        mimetype: 'video/mp4',
        name: 'clip.mp4',
        size: 10,
        tempFilePath,
      },
    } as unknown as PayloadRequest

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: false } } as unknown as SanitizedConfig,
      req,
    })

    expect(await fileExists(tempFilePath)).toBe(true)
  })

  it('removes a multipart temp file when useTempFiles is true', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    const req = {
      file: {
        data: Buffer.alloc(0),
        mimetype: 'video/mp4',
        name: 'clip.mp4',
        size: 10,
        tempFilePath,
      },
    } as unknown as PayloadRequest

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: true } } as unknown as SanitizedConfig,
      req,
    })

    expect(await fileExists(tempFilePath)).toBe(false)
  })

  it('removes a client-upload temp file tracked on req.context after req.file was cleared', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    // Mirrors plugin-cloud-storage's afterChange hook, which clears req.file after uploading
    // generated image sizes but leaves req.context untouched.
    const req = {
      context: { [CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]: tempFilePath },
      file: undefined,
    } as unknown as PayloadRequest

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: false } } as unknown as SanitizedConfig,
      req,
    })

    expect(await fileExists(tempFilePath)).toBe(false)
    expect(req.context[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]).toBeUndefined()
  })

  it('does not attempt a second unlink when the context-tracked path matches req.file.tempFilePath', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    const req = {
      context: { [CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]: tempFilePath },
      file: {
        clientUploadContext: undefined,
        data: Buffer.alloc(0),
        mimetype: 'video/mp4',
        name: 'clip.mp4',
        size: 10,
        tempFilePath,
      },
    } as unknown as PayloadRequest

    await expect(
      unlinkTempFiles({
        collectionConfig,
        config: { upload: { useTempFiles: false } } as unknown as SanitizedConfig,
        req,
      }),
    ).resolves.not.toThrow()

    expect(await fileExists(tempFilePath)).toBe(false)
  })
})
