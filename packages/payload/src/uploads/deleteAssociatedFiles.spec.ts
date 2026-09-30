import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { deleteAssociatedFiles } from './deleteAssociatedFiles.js'
import { fileExists } from './fileExists.js'

describe('deleteAssociatedFiles', () => {
  let staticDir: string
  let testDir: string

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-uploads-'))
    staticDir = path.join(testDir, 'media')
    await fs.mkdir(staticDir)
  })

  afterEach(async () => {
    await fs.rm(testDir, { force: true, recursive: true })
  })

  const getArgs = (doc: Record<string, unknown>) => ({
    collectionConfig: {
      upload: {
        staticDir,
      },
    } as SanitizedCollectionConfig,
    config: {} as SanitizedConfig,
    doc,
    overrideDelete: true,
    req: { t: vi.fn() } as unknown as PayloadRequest,
  })

  it('should only delete files within the upload directory', async () => {
    const filename = 'document.txt'
    const outsidePath = path.join(testDir, filename)
    await fs.writeFile(outsidePath, 'document')

    await expect(
      deleteAssociatedFiles(getArgs({ filename: path.join('..', filename) })),
    ).rejects.toThrow('Invalid filename')

    expect(await fileExists(outsidePath)).toBe(true)
  })

  it('should only delete generated files within the upload directory', async () => {
    const filename = 'document.txt'
    const generatedFilename = 'document-preview.txt'
    const originalPath = path.join(staticDir, filename)
    const outsidePath = path.join(testDir, generatedFilename)
    await Promise.all([
      fs.writeFile(originalPath, 'document'),
      fs.writeFile(outsidePath, 'preview'),
    ])

    await expect(
      deleteAssociatedFiles(
        getArgs({
          filename,
          sizes: {
            preview: { filename: path.join('..', generatedFilename) },
          },
        }),
      ),
    ).rejects.toThrow('Invalid filename')

    expect(await fileExists(originalPath)).toBe(false)
    expect(await fileExists(outsidePath)).toBe(true)
  })

  it('should delete original and generated files within the upload directory', async () => {
    const filename = 'document.txt'
    const generatedFilename = 'document-preview.txt'
    const originalPath = path.join(staticDir, filename)
    const generatedPath = path.join(staticDir, generatedFilename)
    await Promise.all([
      fs.writeFile(originalPath, 'document'),
      fs.writeFile(generatedPath, 'preview'),
    ])

    await deleteAssociatedFiles(
      getArgs({
        filename,
        sizes: {
          preview: { filename: generatedFilename },
        },
      }),
    )

    expect(await fileExists(originalPath)).toBe(false)
    expect(await fileExists(generatedPath)).toBe(false)
  })

  it('should skip generated files without filenames', async () => {
    const filename = 'document.txt'
    const originalPath = path.join(staticDir, filename)
    await fs.writeFile(originalPath, 'document')

    await deleteAssociatedFiles(
      getArgs({
        filename,
        sizes: {
          preview: { filename: null },
        },
      }),
    )

    expect(await fileExists(originalPath)).toBe(false)
  })

  it('should delete files from nested upload directories', async () => {
    const filename = path.join('tenant', 'document.txt')
    const filePath = path.join(staticDir, filename)
    await fs.mkdir(path.dirname(filePath))
    await fs.writeFile(filePath, 'document')

    await deleteAssociatedFiles(getArgs({ filename }))

    expect(await fileExists(filePath)).toBe(false)
  })

  it('should only delete through directories contained by the upload directory', async () => {
    const outsideDir = path.join(testDir, 'documents')
    const filename = 'document.txt'
    const outsidePath = path.join(outsideDir, filename)
    await fs.mkdir(outsideDir)
    await fs.writeFile(outsidePath, 'document')
    await fs.symlink(outsideDir, path.join(staticDir, 'linked'))

    await expect(
      deleteAssociatedFiles(getArgs({ filename: path.join('linked', filename) })),
    ).rejects.toThrow()

    expect(await fileExists(outsidePath)).toBe(true)
  })

  it('should delete links stored directly in the upload directory', async () => {
    const outsidePath = path.join(testDir, 'document.txt')
    const linkPath = path.join(staticDir, 'document.txt')
    await fs.writeFile(outsidePath, 'document')
    await fs.symlink(outsidePath, linkPath)

    await deleteAssociatedFiles(getArgs({ filename: 'document.txt' }))

    expect(await fileExists(linkPath)).toBe(false)
    expect(await fileExists(outsidePath)).toBe(true)
  })
})
