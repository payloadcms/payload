import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PayloadRequest, Where } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { resolveBranchDelete } from '../../branching/tombstone.js'
import { fileExists } from '../../uploads/fileExists.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { deleteOperation } from './delete.js'

describe('deleteOperation', () => {
  const testDirectories: string[] = []

  afterEach(async () => {
    await Promise.all(
      testDirectories
        .splice(0)
        .map((directory) => fs.rm(directory, { force: true, recursive: true })),
    )
  })

  const createDeleteTestContext = ({
    afterDelete,
    beforeDelete,
    bulkOperationsSingleTransaction = false,
    callerTransaction = true,
    documents = [{ id: 1 }],
  }: {
    afterDelete?: (args: { doc: { id: number }; req: PayloadRequest }) => Promise<void> | void
    beforeDelete?: (args: { req: PayloadRequest }) => Promise<void> | void
    bulkOperationsSingleTransaction?: boolean
    callerTransaction?: boolean
    documents?: { id: number }[]
  } = {}) => {
    const collectionConfig = {
      access: {},
      fields: [],
      flattenedFields: [],
      hooks: {
        afterDelete: afterDelete ? [afterDelete] : [],
        beforeDelete: beforeDelete ? [beforeDelete] : [],
      },
      slug: 'documents',
    }
    const commitDatabaseTransaction = vi.fn().mockResolvedValue(undefined)
    const deleteMany = vi.fn().mockResolvedValue({ docs: [] })
    const deleteOne = vi.fn().mockResolvedValue({ id: 1 })
    const rollbackDatabaseTransaction = vi.fn().mockResolvedValue(undefined)
    const updateOne = vi.fn().mockResolvedValue({ id: 1 })
    const payload = {
      collections: {
        documents: { config: collectionConfig },
      },
      config: {
        collections: [collectionConfig],
        defaultDepth: 0,
        globals: [],
        maxDepth: 0,
      },
      db: {
        beginTransaction: vi.fn().mockResolvedValue('operation-transaction'),
        bulkOperationsSingleTransaction,
        commitTransaction: commitDatabaseTransaction,
        deleteMany,
        deleteOne,
        find: vi.fn().mockResolvedValue({ docs: documents }),
        name: 'test',
        rollbackTransaction: rollbackDatabaseTransaction,
        updateOne,
      },
      logger: { error: vi.fn() },
    }
    const req = {
      context: {},
      fallbackLocale: null,
      locale: 'en',
      payload,
      t: vi.fn((key: string) => key),
      ...(callerTransaction ? { transactionID: 'caller-transaction' } : {}),
    } as unknown as PayloadRequest
    const runDelete = () =>
      deleteOperation({
        collection: { config: collectionConfig } as unknown as Collection,
        depth: 0,
        overrideAccess: true,
        overrideLock: true,
        req,
        where: {},
      })

    return {
      commitDatabaseTransaction,
      deleteMany,
      deleteOne,
      req,
      rollbackDatabaseTransaction,
      runDelete,
      updateOne,
    }
  }

  it('should reject a per-document delete error after a caller-owned write attempt', async () => {
    const deleteError = new Error('delete failed after writing')
    const { deleteOne, req, runDelete } = createDeleteTestContext({
      bulkOperationsSingleTransaction: true,
    })

    deleteOne.mockRejectedValueOnce(deleteError)

    await expect(runDelete()).rejects.toBe(deleteError)
    expect(req.transactionID).toBe('caller-transaction')
  })

  it('should reject a batch delete error after a caller-owned write attempt', async () => {
    const deleteError = new Error('batch delete failed after writing')
    const { deleteMany, req, runDelete } = createDeleteTestContext()

    deleteMany.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'documents') {
        throw deleteError
      }

      return { docs: [] }
    })

    await expect(runDelete()).rejects.toBe(deleteError)
    expect(req.transactionID).toBe('caller-transaction')
  })

  it('should reject an afterDelete error after a caller-owned batch delete', async () => {
    const afterDeleteError = new Error('afterDelete failed')
    const { deleteMany, req, runDelete } = createDeleteTestContext({
      afterDelete: () => {
        throw afterDeleteError
      },
    })

    await expect(runDelete()).rejects.toBe(afterDeleteError)
    expect(deleteMany).toHaveBeenCalledWith(expect.objectContaining({ collection: 'documents' }))
    expect(req.transactionID).toBe('caller-transaction')
  })

  it('should reject an undefined afterDelete error after a caller-owned batch delete', async () => {
    const { runDelete } = createDeleteTestContext({
      afterDelete: () => {
        throw undefined
      },
    })

    await expect(runDelete()).rejects.toBeUndefined()
  })

  it('should reject a write-capable beforeDelete hook error in a caller-owned transaction', async () => {
    const beforeDeleteError = new Error('beforeDelete failed after writing')
    const { req, runDelete, updateOne } = createDeleteTestContext({
      beforeDelete: async ({ req }) => {
        await req.payload.db.updateOne({
          id: 1,
          collection: 'documents',
          data: { title: 'hook write' },
          req,
        })
        throw beforeDeleteError
      },
    })

    await expect(runDelete()).rejects.toBe(beforeDeleteError)
    expect(updateOne).toHaveBeenCalledOnce()
    expect(req.transactionID).toBe('caller-transaction')
  })

  it('should roll back an operation-owned shared transaction when afterDelete fails', async () => {
    const afterDeleteError = new Error('afterDelete failed in operation transaction')
    const { commitDatabaseTransaction, req, rollbackDatabaseTransaction, runDelete } =
      createDeleteTestContext({
        afterDelete: () => {
          throw afterDeleteError
        },
        callerTransaction: false,
      })

    await expect(runDelete()).rejects.toBe(afterDeleteError)
    expect(commitDatabaseTransaction).not.toHaveBeenCalled()
    expect(rollbackDatabaseTransaction).toHaveBeenCalledWith('operation-transaction')
    expect(req).not.toHaveProperty('transactionID')
  })

  it('should roll back an operation-owned shared transaction when a write-capable beforeDelete hook fails', async () => {
    const beforeDeleteError = new Error('beforeDelete failed in operation transaction')
    const { commitDatabaseTransaction, req, rollbackDatabaseTransaction, runDelete, updateOne } =
      createDeleteTestContext({
        beforeDelete: async ({ req }) => {
          await req.payload.db.updateOne({
            id: 1,
            collection: 'documents',
            data: { title: 'hook write' },
            req,
          })
          throw beforeDeleteError
        },
        callerTransaction: false,
      })

    await expect(runDelete()).rejects.toBe(beforeDeleteError)
    expect(updateOne).toHaveBeenCalledOnce()
    expect(commitDatabaseTransaction).not.toHaveBeenCalled()
    expect(rollbackDatabaseTransaction).toHaveBeenCalledWith('operation-transaction')
    expect(req).not.toHaveProperty('transactionID')
  })

  it('should run write-capable beforeDelete hooks inside operation-owned per-document transactions', async () => {
    const beforeDeleteError = new Error('beforeDelete failed in document transaction')
    let hookTransactionID: null | number | string | undefined
    const { commitDatabaseTransaction, rollbackDatabaseTransaction, runDelete, updateOne } =
      createDeleteTestContext({
        beforeDelete: async ({ req }) => {
          hookTransactionID = await req.transactionID
          await req.payload.db.updateOne({
            id: 1,
            collection: 'documents',
            data: { title: 'hook write' },
            req,
          })
          throw beforeDeleteError
        },
        bulkOperationsSingleTransaction: true,
        callerTransaction: false,
      })

    await expect(runDelete()).resolves.toEqual({
      docs: [],
      errors: [expect.objectContaining({ id: 1, message: beforeDeleteError.message })],
    })
    expect(hookTransactionID).toBe('operation-transaction')
    expect(updateOne).toHaveBeenCalledOnce()
    expect(commitDatabaseTransaction).not.toHaveBeenCalled()
    expect(rollbackDatabaseTransaction).toHaveBeenCalledWith('operation-transaction')
  })

  it('should stop shared post-delete work after the first failure', async () => {
    const afterDeleteError = new Error('first afterDelete failed')
    const processedDocumentIDs: number[] = []
    const { runDelete } = createDeleteTestContext({
      afterDelete: ({ doc }) => {
        processedDocumentIDs.push(doc.id)

        if (doc.id === 1) {
          throw afterDeleteError
        }
      },
      documents: [{ id: 1 }, { id: 2 }],
    })

    await expect(runDelete()).rejects.toBe(afterDeleteError)
    expect(processedDocumentIDs).toEqual([1])
  })

  it('should stop branch cleanup after the first failure in a caller-owned transaction', async () => {
    const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-branch-delete-cleanup-'))
    const staticDirectory = path.join(testDirectory, 'uploads')
    const retainedFilename = 'later-document.txt'
    const retainedFilePath = path.join(staticDirectory, retainedFilename)
    const documents = [
      {
        id: 1,
        _branch: 'feature',
        _branchOp: 'create',
        filename: path.join('..', 'invalid.txt'),
      },
      { id: 2, _branch: 'feature', _branchOp: 'create', filename: retainedFilename },
    ]

    testDirectories.push(testDirectory)
    await fs.mkdir(staticDirectory)
    await fs.writeFile(retainedFilePath, 'retain this document')

    const collectionConfig = {
      access: {},
      fields: [],
      flattenedFields: [],
      hooks: {},
      slug: 'uploads',
      upload: { staticDir: staticDirectory },
    }
    const commitDatabaseTransaction = vi.fn().mockResolvedValue(undefined)
    const deleteOne = vi.fn(
      async ({
        collection,
        req,
        where,
      }: {
        collection: string
        req: PayloadRequest
        where: Where
      }) => resolveBranchDelete({ collectionSlug: collection, req, where }),
    )
    const payload = {
      blocks: {},
      collections: { uploads: { config: collectionConfig } },
      config: {
        branching: {
          branchableCollections: new Set(['uploads']),
          branchableGlobals: new Set(),
          enabled: true,
        },
        collections: [collectionConfig],
        defaultDepth: 0,
        globals: [],
        maxDepth: 0,
      },
      db: {
        commitTransaction: commitDatabaseTransaction,
        deleteMany: vi.fn().mockResolvedValue({ docs: [] }),
        deleteOne,
        find: vi.fn().mockResolvedValue({ docs: documents }),
        findOne: vi.fn().mockImplementation(({ where }) => {
          const findDocumentID = (condition: unknown): unknown => {
            if (Array.isArray(condition)) {
              for (const nestedCondition of condition) {
                const id = findDocumentID(nestedCondition)

                if (id !== undefined) {
                  return id
                }
              }

              return undefined
            }

            if (!condition || typeof condition !== 'object') {
              return undefined
            }

            const record = condition as Record<string, unknown>

            for (const fieldName of ['id', '_branchDocID']) {
              const fieldCondition = record[fieldName] as { equals?: unknown } | undefined

              if (fieldCondition?.equals !== undefined) {
                return fieldCondition.equals
              }
            }

            return findDocumentID(Object.values(record))
          }
          const id = findDocumentID(where)

          return documents.find((document) => document.id === id) ?? null
        }),
        name: 'test',
      },
      globals: { config: [] },
      logger: { error: vi.fn() },
    }
    const req = {
      branch: 'feature',
      context: { _branchWritable: new Map([['feature', true]]) },
      fallbackLocale: null,
      locale: 'en',
      payload,
      t: vi.fn((key: string) => key),
      transactionID: 'caller-transaction',
    } as unknown as PayloadRequest

    await expect(
      deleteOperation({
        collection: { config: collectionConfig } as unknown as Collection,
        depth: 0,
        overrideAccess: true,
        overrideLock: true,
        req,
        where: {},
      }),
    ).rejects.toThrow('Invalid filename.')

    await new Promise((resolve) => setTimeout(resolve, 50))
    await commitTransaction(req)

    expect(deleteOne).toHaveBeenCalledTimes(2)
    expect(commitDatabaseTransaction).toHaveBeenCalledWith('caller-transaction')
    expect(await fileExists(retainedFilePath)).toBe(true)
  })

  it('should reject cleanup failure after a beforeDelete hook writes in a caller-owned transaction', async () => {
    const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-bulk-delete-hook-'))
    const staticDirectory = path.join(testDirectory, 'uploads')
    const filename = 'retained-after-hook.txt'
    const filePath = path.join(staticDirectory, filename)

    testDirectories.push(testDirectory)
    await fs.mkdir(staticDirectory)
    await fs.writeFile(filePath, 'retain this document')

    const updateOne = vi.fn().mockResolvedValue({ id: 1 })
    const collectionConfig = {
      access: {},
      fields: [],
      flattenedFields: [],
      hooks: {
        beforeDelete: [
          async ({ req }: { req: PayloadRequest }) => {
            await req.payload.db.updateOne({
              id: 1,
              collection: 'uploads',
              data: { title: 'hook write' },
              req,
            })
          },
        ],
      },
      slug: 'uploads',
      upload: { staticDir: staticDirectory },
    }
    const payload = {
      collections: { uploads: { config: collectionConfig } },
      config: {
        collections: [collectionConfig],
        defaultDepth: 0,
        globals: [],
        maxDepth: 0,
      },
      db: {
        deleteMany: vi.fn().mockResolvedValue({ docs: [] }),
        find: vi.fn().mockResolvedValue({
          docs: [
            {
              id: 1,
              filename,
              sizes: { preview: { filename: path.join('..', 'outside-preview.txt') } },
            },
          ],
        }),
        name: 'test',
        updateOne,
      },
      logger: { error: vi.fn() },
    }
    const req = {
      context: {},
      fallbackLocale: null,
      locale: 'en',
      payload,
      t: vi.fn((key: string) => key),
      transactionID: 'caller-transaction',
    } as unknown as PayloadRequest

    await expect(
      deleteOperation({
        collection: { config: collectionConfig } as unknown as Collection,
        depth: 0,
        overrideAccess: true,
        overrideLock: true,
        req,
        where: {},
      }),
    ).rejects.toThrow('Invalid filename.')

    expect(updateOne).toHaveBeenCalledOnce()
    expect(req.transactionID).toBe('caller-transaction')
    expect(await fileExists(filePath)).toBe(true)
  })

  it('should retain files for a document whose cleanup validation fails', async () => {
    const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-bulk-delete-'))
    const staticDirectory = path.join(testDirectory, 'uploads')
    const retainedFilename = 'retained.txt'
    const deletedFilename = 'deleted.txt'
    const retainedFilePath = path.join(staticDirectory, retainedFilename)
    const deletedFilePath = path.join(staticDirectory, deletedFilename)

    testDirectories.push(testDirectory)
    await fs.mkdir(staticDirectory)
    await Promise.all([
      fs.writeFile(retainedFilePath, 'retain this document'),
      fs.writeFile(deletedFilePath, 'delete this document'),
    ])

    const collectionConfig = {
      access: {},
      fields: [],
      flattenedFields: [],
      hooks: {},
      slug: 'uploads',
      upload: { staticDir: staticDirectory },
    }
    const documents = [
      {
        id: 1,
        filename: retainedFilename,
        sizes: { preview: { filename: path.join('..', 'outside-preview.txt') } },
      },
      { id: 2, filename: deletedFilename },
    ]
    const deleteMany = vi.fn().mockResolvedValue({ docs: [] })
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const payload = {
      collections: {
        uploads: { config: collectionConfig },
      },
      config: {
        collections: [collectionConfig],
        defaultDepth: 0,
        globals: [],
        maxDepth: 0,
      },
      db: {
        commitTransaction: databaseCommit,
        deleteMany,
        find: vi.fn().mockResolvedValue({ docs: documents }),
        name: 'test',
      },
      logger: { error: vi.fn() },
    }
    const req = {
      context: {},
      fallbackLocale: null,
      locale: 'en',
      payload,
      t: vi.fn((key: string) => key),
      transactionID: 'caller-transaction',
    } as unknown as PayloadRequest

    const result = await deleteOperation({
      collection: { config: collectionConfig } as unknown as Collection,
      depth: 0,
      overrideAccess: true,
      overrideLock: true,
      req,
      where: {},
    })

    expect(result.errors).toEqual([
      expect.objectContaining({ id: 1, message: 'Invalid filename.' }),
    ])
    expect(result.docs).toEqual([expect.objectContaining({ id: 2 })])
    expect(await fileExists(retainedFilePath)).toBe(true)
    expect(await fileExists(deletedFilePath)).toBe(true)

    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('caller-transaction')
    expect(await fileExists(retainedFilePath)).toBe(true)
    expect(await fileExists(deletedFilePath)).toBe(false)
  })
})
