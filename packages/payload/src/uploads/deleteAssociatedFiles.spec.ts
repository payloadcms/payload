import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { ErrorDeletingFile } from '../errors/index.js'
import { deleteAssociatedFiles } from './deleteAssociatedFiles.js'

describe('deleteAssociatedFiles', () => {
  let testDir: string
  let uploadDir: string

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-upload-delete-'))
    uploadDir = path.join(testDir, 'uploads')
    await fs.mkdir(uploadDir)
  })

  afterEach(async () => {
    await fs.rm(testDir, { force: true, recursive: true })
  })

  it('deletes files from the configured upload directory', async () => {
    const filename = 'document.txt'
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, 'content')

    await deleteAssociatedFiles({
      collectionConfig: { upload: { staticDir: uploadDir } } as SanitizedCollectionConfig,
      config: {} as SanitizedConfig,
      doc: { filename },
      overrideDelete: true,
      req: {} as PayloadRequest,
    })

    await expect(fs.access(filePath)).rejects.toThrow()
  })

  it('deletes files from nested directories within the configured upload directory', async () => {
    const filename = path.join('tenant', 'document.txt')
    const filePath = path.join(uploadDir, filename)
    await fs.mkdir(path.dirname(filePath))
    await fs.writeFile(filePath, 'content')

    await deleteAssociatedFiles({
      collectionConfig: { upload: { staticDir: uploadDir } } as SanitizedCollectionConfig,
      config: {} as SanitizedConfig,
      doc: { filename },
      overrideDelete: true,
      req: {} as PayloadRequest,
    })

    await expect(fs.access(filePath)).rejects.toThrow()
  })

  it('rejects filenames outside the configured upload directory', async () => {
    const filePath = path.join(testDir, 'document.txt')
    await fs.writeFile(filePath, 'content')

    await expect(
      deleteAssociatedFiles({
        collectionConfig: { upload: { staticDir: uploadDir } } as SanitizedCollectionConfig,
        config: {} as SanitizedConfig,
        doc: { filename: path.relative(uploadDir, filePath) },
        overrideDelete: true,
        req: {} as PayloadRequest,
      }),
    ).rejects.toBeInstanceOf(ErrorDeletingFile)

    await expect(fs.readFile(filePath, 'utf8')).resolves.toBe('content')
  })

  it('rejects generated size filenames outside the configured upload directory', async () => {
    const filePath = path.join(testDir, 'thumbnail.txt')
    await fs.writeFile(filePath, 'content')

    await expect(
      deleteAssociatedFiles({
        collectionConfig: { upload: { staticDir: uploadDir } } as SanitizedCollectionConfig,
        config: {} as SanitizedConfig,
        doc: {
          filename: 'document.txt',
          sizes: { thumbnail: { filename: path.relative(uploadDir, filePath) } },
        },
        overrideDelete: true,
        req: {} as PayloadRequest,
      }),
    ).rejects.toBeInstanceOf(ErrorDeletingFile)

    await expect(fs.readFile(filePath, 'utf8')).resolves.toBe('content')
  })

  it('rejects files reached through linked directories outside the configured upload directory', async () => {
    const externalDir = path.join(testDir, 'documents')
    const filePath = path.join(externalDir, 'document.txt')
    await fs.mkdir(externalDir)
    await fs.writeFile(filePath, 'content')
    await fs.symlink(externalDir, path.join(uploadDir, 'linked'), 'dir')

    await expect(
      deleteAssociatedFiles({
        collectionConfig: { upload: { staticDir: uploadDir } } as SanitizedCollectionConfig,
        config: {} as SanitizedConfig,
        doc: { filename: path.join('linked', 'document.txt') },
        overrideDelete: true,
        req: {} as PayloadRequest,
      }),
    ).rejects.toBeInstanceOf(ErrorDeletingFile)

    await expect(fs.readFile(filePath, 'utf8')).resolves.toBe('content')
  })
})
