import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { commitTransaction } from '../utilities/commitTransaction.js'
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
    req: {
      context: {},
      payload: { db: {} },
      t: vi.fn(),
    } as unknown as PayloadRequest,
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

  it('should keep all files when a generated filename is outside the upload directory', async () => {
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

    expect(await fileExists(originalPath)).toBe(true)
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

  it('should keep a file replaced after deferred deletion was scheduled', async () => {
    const filename = 'concurrent-replacement.txt'
    const filePath = path.join(staticDir, filename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest

    await fs.writeFile(filePath, 'original')
    await deleteAssociatedFiles({ ...getArgs({ filename }), req })
    await fs.writeFile(filePath, 'concurrent replacement')
    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(await fs.readFile(filePath, 'utf8')).toBe('concurrent replacement')
  })

  it('should keep a replacement installed immediately before deferred deletion mutates the path', async () => {
    const filename = 'replacement-during-deferred-deletion.txt'
    const filePath = path.join(staticDir, filename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest

    await fs.writeFile(filePath, 'original')
    await deleteAssociatedFiles({ ...getArgs({ filename }), req })

    const rename = fs.rename.bind(fs)

    vi.spyOn(fs, 'rename').mockImplementation(async (sourcePath, destinationPath) => {
      if (sourcePath === filePath) {
        await fs.writeFile(filePath, 'concurrent replacement')
      }

      return rename(sourcePath, destinationPath)
    })

    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(await fs.readFile(filePath, 'utf8')).toBe('concurrent replacement')
  })

  it('should keep a replacement written to the same path before deferred cleanup runs', async () => {
    const filename = 'same-path-replacement.txt'
    const filePath = path.join(staticDir, filename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest

    await fs.writeFile(filePath, 'original')
    await deleteAssociatedFiles({
      ...getArgs({ filename }),
      files: [{ buffer: Buffer.from('replacement'), path: filePath }],
      overrideDelete: false,
      req,
    })
    await fs.writeFile(filePath, 'replacement')
    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(await fs.readFile(filePath, 'utf8')).toBe('replacement')
  })

  it('should keep a file created after a missing deletion target was checked', async () => {
    const filename = 'created-after-cleanup-check.txt'
    const filePath = path.join(staticDir, filename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest

    await deleteAssociatedFiles({ ...getArgs({ filename }), req })
    await fs.writeFile(filePath, 'replacement')
    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(await fs.readFile(filePath, 'utf8')).toBe('replacement')
  })
})
