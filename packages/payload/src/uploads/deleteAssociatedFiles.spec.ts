import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { commitTransaction } from '../utilities/commitTransaction.js'
import { killTransaction } from '../utilities/killTransaction.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
} from '../utilities/transactionCallbacks.js'
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

  it('should defer file deletion until the active transaction commits', async () => {
    const filename = 'committed-document.txt'
    const filePath = path.join(staticDir, filename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest

    await fs.writeFile(filePath, 'document')

    await deleteAssociatedFiles({
      ...getArgs({ filename }),
      req,
    })

    expect(await fileExists(filePath)).toBe(true)

    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(await fileExists(filePath)).toBe(false)
  })

  it('should cancel deferred file deletion when the active transaction rolls back', async () => {
    const filename = 'rolled-back-document.txt'
    const filePath = path.join(staticDir, filename)
    const databaseRollback = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { rollbackTransaction: databaseRollback } },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest

    await fs.writeFile(filePath, 'document')

    await deleteAssociatedFiles({
      ...getArgs({ filename }),
      req,
    })
    await killTransaction(req)

    expect(databaseRollback).toHaveBeenCalledWith('transaction-id')
    expect(await fileExists(filePath)).toBe(true)
  })

  it('should report cleanup failure without rejecting a committed transaction', async () => {
    const filename = 'cleanup-failure-document.txt'
    const filePath = path.join(staticDir, filename)
    const cleanupError = new Error('File system unavailable')
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const loggerError = vi.fn()
    const req = {
      context: {},
      payload: {
        db: { commitTransaction: databaseCommit },
        logger: { error: loggerError },
      },
      t: vi.fn(),
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockRejectedValueOnce(cleanupError)

    await fs.writeFile(filePath, 'document')
    await deleteAssociatedFiles({ ...getArgs({ filename }), req })

    await expect(commitTransaction(req)).resolves.toBeUndefined()

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(loggerError).toHaveBeenCalledWith({
      err: expect.any(Error),
      msg: 'A post-commit cleanup task failed.',
    })
    expect(await fileExists(filePath)).toBe(true)

    unlinkSpy.mockRestore()
  })

  it('should report cleanup failure without rejecting a completed non-transactional operation', async () => {
    const filename = 'non-transactional-cleanup-failure-document.txt'
    const filePath = path.join(staticDir, filename)
    const cleanupError = new Error('File system unavailable')
    const loggerError = vi.fn()
    const req = {
      context: {},
      payload: {
        db: {},
        logger: { error: loggerError },
      },
      t: vi.fn(),
    } as unknown as PayloadRequest
    const operationScope = await beginDeferredCleanupScope({ req })
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockRejectedValueOnce(cleanupError)

    await fs.writeFile(filePath, 'document')
    await deleteAssociatedFiles({ ...getArgs({ filename }), req })

    await expect(
      flushDeferredCleanupScopeAfterOperation({ req, scope: operationScope }),
    ).resolves.toBeUndefined()

    expect(loggerError).toHaveBeenCalledWith({
      err: expect.any(Error),
      msg: 'A post-commit cleanup task failed.',
    })
    expect(await fileExists(filePath)).toBe(true)

    unlinkSpy.mockRestore()
  })

  it('should reject cleanup failure from a helper-owned non-transactional scope', async () => {
    const filename = 'helper-cleanup-failure-document.txt'
    const filePath = path.join(staticDir, filename)
    const req = {
      context: {},
      payload: { db: {} },
      t: vi.fn(),
    } as unknown as PayloadRequest
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockRejectedValueOnce(new Error('Unavailable'))

    await fs.writeFile(filePath, 'document')

    await expect(deleteAssociatedFiles({ ...getArgs({ filename }), req })).rejects.toThrow()
    expect(await fileExists(filePath)).toBe(true)

    unlinkSpy.mockRestore()
  })

  it('should keep cleanup isolated when requests share context but use different transactions', async () => {
    const outerFilename = 'outer-document.txt'
    const innerFilename = 'inner-document.txt'
    const outerFilePath = path.join(staticDir, outerFilename)
    const innerFilePath = path.join(staticDir, innerFilename)
    const sharedContext = {}
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const database = { commitTransaction: databaseCommit }
    const outerReq = {
      context: sharedContext,
      payload: { db: database },
      t: vi.fn(),
      transactionID: 'outer-transaction',
    } as unknown as PayloadRequest
    const innerReq = {
      context: sharedContext,
      payload: { db: database },
      t: vi.fn(),
      transactionID: 'inner-transaction',
    } as unknown as PayloadRequest

    await Promise.all([
      fs.writeFile(outerFilePath, 'outer document'),
      fs.writeFile(innerFilePath, 'inner document'),
    ])
    await deleteAssociatedFiles({ ...getArgs({ filename: outerFilename }), req: outerReq })
    await deleteAssociatedFiles({ ...getArgs({ filename: innerFilename }), req: innerReq })

    await commitTransaction(innerReq)

    expect(await fileExists(innerFilePath)).toBe(false)
    expect(await fileExists(outerFilePath)).toBe(true)

    await commitTransaction(outerReq)

    expect(await fileExists(outerFilePath)).toBe(false)
  })

  it('should defer file deletion until a non-transactional operation succeeds', async () => {
    const filename = 'non-transactional-document.txt'
    const filePath = path.join(staticDir, filename)
    const req = {
      context: {},
      payload: { db: {} },
      t: vi.fn(),
    } as unknown as PayloadRequest
    const cleanupScope = await beginDeferredCleanupScope({ req })

    await fs.writeFile(filePath, 'document')
    await deleteAssociatedFiles({ ...getArgs({ filename }), req })

    expect(await fileExists(filePath)).toBe(true)

    await flushDeferredCleanupScope({ req, scope: cleanupScope! })

    expect(await fileExists(filePath)).toBe(false)
  })

  it('should cancel file deletion when a non-transactional operation fails', async () => {
    const filename = 'failed-non-transactional-document.txt'
    const filePath = path.join(staticDir, filename)
    const req = {
      context: {},
      payload: { db: {} },
      t: vi.fn(),
    } as unknown as PayloadRequest
    const cleanupScope = await beginDeferredCleanupScope({ req })

    await fs.writeFile(filePath, 'document')
    await deleteAssociatedFiles({ ...getArgs({ filename }), req })
    clearDeferredCleanupScope({ req, scope: cleanupScope! })

    expect(await fileExists(filePath)).toBe(true)
  })

  it('should share an operation cleanup scope across concurrent file deletions', async () => {
    const firstFilename = 'first-concurrent-document.txt'
    const secondFilename = 'second-concurrent-document.txt'
    const firstFilePath = path.join(staticDir, firstFilename)
    const secondFilePath = path.join(staticDir, secondFilename)
    const req = {
      context: {},
      payload: { db: {} },
      t: vi.fn(),
    } as unknown as PayloadRequest
    const cleanupScope = await beginDeferredCleanupScope({ req })

    await Promise.all([
      fs.writeFile(firstFilePath, 'first document'),
      fs.writeFile(secondFilePath, 'second document'),
    ])

    await Promise.all([
      deleteAssociatedFiles({ ...getArgs({ filename: firstFilename }), req }),
      deleteAssociatedFiles({ ...getArgs({ filename: secondFilename }), req }),
    ])

    expect(await fileExists(firstFilePath)).toBe(true)
    expect(await fileExists(secondFilePath)).toBe(true)

    await flushDeferredCleanupScope({ req, scope: cleanupScope! })

    expect(await fileExists(firstFilePath)).toBe(false)
    expect(await fileExists(secondFilePath)).toBe(false)
  })

  it('should discard failed nested operation cleanup without removing earlier transaction cleanup', async () => {
    const earlierFilename = 'earlier-transaction-document.txt'
    const failedFilename = 'failed-transaction-document.txt'
    const earlierFilePath = path.join(staticDir, earlierFilename)
    const failedFilePath = path.join(staticDir, failedFilename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'caller-owned-transaction',
    } as unknown as PayloadRequest

    await Promise.all([
      fs.writeFile(earlierFilePath, 'earlier document'),
      fs.writeFile(failedFilePath, 'failed document'),
    ])
    await deleteAssociatedFiles({ ...getArgs({ filename: earlierFilename }), req })

    const failedOperationScope = await beginDeferredCleanupScope({ req })

    await deleteAssociatedFiles({ ...getArgs({ filename: failedFilename }), req })
    clearDeferredCleanupScope({ req, scope: failedOperationScope! })

    await commitTransaction(req)

    expect(await fileExists(earlierFilePath)).toBe(false)
    expect(await fileExists(failedFilePath)).toBe(true)
  })

  it('should retain later cleanup after an empty nested transaction checkpoint is cleared', async () => {
    const failedFilename = 'failed-first-transaction-document.txt'
    const successfulFilename = 'successful-second-transaction-document.txt'
    const failedFilePath = path.join(staticDir, failedFilename)
    const successfulFilePath = path.join(staticDir, successfulFilename)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      t: vi.fn(),
      transactionID: 'caller-owned-transaction',
    } as unknown as PayloadRequest
    const operationScope = await beginDeferredCleanupScope({ req })

    await Promise.all([
      fs.writeFile(failedFilePath, 'failed document'),
      fs.writeFile(successfulFilePath, 'successful document'),
    ])

    const failedDocumentScope = await beginDeferredCleanupScope({ req })

    await deleteAssociatedFiles({ ...getArgs({ filename: failedFilename }), req })
    clearDeferredCleanupScope({ req, scope: failedDocumentScope })

    const successfulDocumentScope = await beginDeferredCleanupScope({ req })

    await deleteAssociatedFiles({ ...getArgs({ filename: successfulFilename }), req })
    await flushDeferredCleanupScope({ req, scope: successfulDocumentScope })
    await flushDeferredCleanupScope({ req, scope: operationScope })
    await commitTransaction(req)

    expect(await fileExists(failedFilePath)).toBe(true)
    expect(await fileExists(successfulFilePath)).toBe(false)
  })
})
