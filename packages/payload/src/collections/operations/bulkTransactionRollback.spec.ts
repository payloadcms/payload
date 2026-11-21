import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { killTransaction } from '../../utilities/killTransaction.js'
import { deleteOperation } from './delete.js'
import { updateOperation } from './update.js'

type TestDoc = {
  id: string
  title: string
}

const createHarness = ({
  afterChange,
  afterDelete,
  beforeChange,
  beforeDelete,
  beforeOperation,
  transactional = true,
}: {
  afterChange?: NonNullable<NonNullable<Collection['config']['hooks']>['afterChange']>
  afterDelete?: NonNullable<NonNullable<Collection['config']['hooks']>['afterDelete']>
  beforeChange?: NonNullable<NonNullable<Collection['config']['hooks']>['beforeChange']>
  beforeDelete?: NonNullable<NonNullable<Collection['config']['hooks']>['beforeDelete']>
  beforeOperation?: NonNullable<NonNullable<Collection['config']['hooks']>['beforeOperation']>
  transactional?: boolean
} = {}) => {
  let txCounter = 0
  const sessions: Record<string, { db: { name: string } }> = {}
  const updatedCalls: Array<{ id: number | string; transactionID: unknown }> = []
  const deletedBatches: Array<{ ids: (number | string)[]; transactionID: unknown }> = []

  const docs: TestDoc[] = [
    { id: 'doc-a', title: 'A' },
    { id: 'doc-b', title: 'B' },
  ]

  const beginTransaction = vi.fn(async () => {
    if (!transactional) {
      return null
    }
    txCounter += 1
    const id = `tx-${txCounter}`
    sessions[id] = { db: { name: id } }
    return id
  })

  const commitTransaction = vi.fn(async (id: number | string) => {
    delete sessions[String(id)]
  })

  const rollbackTransaction = vi.fn(async (id: number | string) => {
    delete sessions[String(id)]
  })

  const updateOne = vi.fn(async ({ id, data, req }: any) => {
    updatedCalls.push({ id, transactionID: req?.transactionID })
    return { ...data, id }
  })

  const deleteMany = vi.fn(async ({ req, where }: any) => {
    const ids = where?.id?.in ?? []
    deletedBatches.push({ ids, transactionID: req?.transactionID })
    return null
  })

  const find = vi.fn(async ({ collection }: any) => {
    if (collection === 'posts') {
      return { docs: docs.map((doc) => ({ ...doc })), totalDocs: docs.length }
    }
    return { docs: [], totalDocs: 0 }
  })

  const collectionConfig = {
    slug: 'posts',
    access: {
      delete: () => true,
      read: () => true,
      update: () => true,
    },
    admin: {},
    auth: false,
    fields: [
      {
        name: 'title',
        type: 'text',
      },
    ],
    flattenedFields: [
      {
        name: 'title',
        type: 'text',
      },
    ],
    hooks: {
      afterChange: afterChange ?? [],
      afterDelete: afterDelete ?? [],
      afterOperation: [],
      afterRead: [],
      beforeChange: beforeChange ?? [],
      beforeDelete: beforeDelete ?? [],
      beforeOperation: beforeOperation ?? [],
      beforeValidate: [],
    },
    lockDocuments: false,
    timestamps: false,
    trash: false,
    upload: false,
    versions: false,
  } as unknown as Collection['config']

  const collection: Collection = {
    config: collectionConfig,
    customIDType: undefined,
  }

  const payload = {
    collections: {
      posts: collection,
    },
    config: {
      collections: [collectionConfig],
      debug: false,
      defaultDepth: 0,
      defaultMaxTextLength: 40000,
      localization: false,
      routes: { api: '/api' },
    },
    db: {
      beginTransaction,
      bulkOperationsSingleTransaction: false,
      commitTransaction,
      deleteMany,
      find,
      rollbackTransaction,
      sessions,
      updateOne,
    },
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
    },
  }

  const req = {
    context: {},
    fallbackLocale: undefined,
    headers: new Headers(),
    i18n: { t: (key: string) => key },
    locale: undefined,
    payload,
    t: (key: string) => key,
  } as unknown as PayloadRequest

  return {
    beginTransaction,
    collection,
    commitTransaction,
    deletedBatches,
    deleteMany,
    req,
    rollbackTransaction,
    sessions,
    updatedCalls,
    updateOne,
  }
}

describe('bulk operations with rolled-back shared transaction', () => {
  describe('updateOperation', () => {
    it('aborts without updating later documents when an earlier hook kills the shared transaction and throws', async () => {
      const processedIDs: string[] = []
      const { commitTransaction, collection, req, rollbackTransaction, updatedCalls } =
        createHarness({
          beforeChange: [
            async ({ originalDoc, req: hookReq }) => {
              processedIDs.push(String(originalDoc.id))
              if (originalDoc.id === 'doc-a') {
                await killTransaction(hookReq)
                throw new Error('nested operation failed')
              }
            },
          ],
        })

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('nested operation failed')

      expect(processedIDs).toEqual(['doc-a'])
      expect(updatedCalls).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('aborts without writing doc A or doc B when beforeChange catches a nested failure that killed the transaction', async () => {
      const processedIDs: string[] = []
      const { commitTransaction, collection, req, rollbackTransaction, updatedCalls } =
        createHarness({
          beforeChange: [
            async ({ data, originalDoc, req: hookReq }) => {
              processedIDs.push(String(originalDoc.id))
              if (originalDoc.id === 'doc-a') {
                try {
                  await killTransaction(hookReq)
                  throw new Error('nested operation failed')
                } catch {
                  // hook swallows the nested error
                }
              }
              return data
            },
          ],
        })

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 is no longer active.')

      expect(processedIDs).toEqual(['doc-a'])
      expect(updatedCalls).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('aborts without updating doc B when afterChange kills the transaction and catches the error', async () => {
      const processedIDs: string[] = []
      const { commitTransaction, collection, req, rollbackTransaction, updatedCalls } =
        createHarness({
          afterChange: [
            async ({ doc, req: hookReq }) => {
              processedIDs.push(String(doc.id))
              if (doc.id === 'doc-a') {
                await killTransaction(hookReq)
              }
              return doc
            },
          ],
        })

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 was rolled back before the bulk update completed.')

      expect(processedIDs).toEqual(['doc-a'])
      // doc-a wrote inside tx-1 (which was rolled back); doc-b never ran at all
      expect(updatedCalls).toEqual([{ id: 'doc-a', transactionID: 'tx-1' }])
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('aborts when a hook rolls back the adapter session directly without clearing req.transactionID', async () => {
      const { commitTransaction, collection, req, rollbackTransaction, updatedCalls } =
        createHarness({
          beforeChange: [
            async ({ data, originalDoc, req: hookReq }) => {
              if (originalDoc.id === 'doc-a') {
                await hookReq.payload.db.rollbackTransaction(hookReq.transactionID!)
              }
              return data
            },
          ],
        })

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 is no longer active.')

      expect(updatedCalls).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('rolls back only the owned transaction and preserves a replacement transactionID set by a hook', async () => {
      const { commitTransaction, collection, req, rollbackTransaction, sessions, updatedCalls } =
        createHarness({
          beforeChange: [
            async ({ data, originalDoc, req: hookReq }) => {
              if (originalDoc.id === 'doc-a') {
                sessions['tx-replacement'] = { db: { name: 'tx-replacement' } }
                hookReq.transactionID = 'tx-replacement'
              }
              return data
            },
          ],
        })

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 is no longer active.')

      expect(updatedCalls).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
      expect(sessions).not.toHaveProperty('tx-1')
      expect(sessions).toHaveProperty('tx-replacement')
      expect(req.transactionID).toBe('tx-replacement')
    })

    it('rolls back only the joined parent transaction and preserves a replacement transactionID set by a hook', async () => {
      const {
        beginTransaction,
        commitTransaction,
        collection,
        req,
        rollbackTransaction,
        sessions,
        updatedCalls,
      } = createHarness({
        beforeChange: [
          async ({ data, originalDoc, req: hookReq }) => {
            if (originalDoc.id === 'doc-a') {
              sessions['tx-replacement'] = { db: { name: 'tx-replacement' } }
              hookReq.transactionID = 'tx-replacement'
            }
            return data
          },
        ],
      })

      sessions['tx-parent'] = { db: { name: 'tx-parent' } }
      req.transactionID = 'tx-parent'

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-parent is no longer active.')

      expect(beginTransaction).not.toHaveBeenCalled()
      expect(updatedCalls).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-parent')
      expect(commitTransaction).not.toHaveBeenCalled()
      expect(sessions).not.toHaveProperty('tx-parent')
      expect(sessions).toHaveProperty('tx-replacement')
      expect(req.transactionID).toBe('tx-replacement')
    })

    it('does not roll back a hook-installed transaction when started with disableTransaction', async () => {
      const {
        beginTransaction,
        commitTransaction,
        collection,
        req,
        rollbackTransaction,
        sessions,
        updatedCalls,
      } = createHarness({
        beforeOperation: [
          async ({ req: hookReq }) => {
            sessions['tx-hook'] = { db: { name: 'tx-hook' } }
            hookReq.transactionID = 'tx-hook'
            throw new Error('hook failed after opening tx-hook')
          },
        ],
      })

      await expect(
        updateOperation({
          collection,
          data: { title: 'updated' },
          disableTransaction: true,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('hook failed after opening tx-hook')

      expect(beginTransaction).not.toHaveBeenCalled()
      expect(updatedCalls).toEqual([])
      expect(rollbackTransaction).not.toHaveBeenCalled()
      expect(commitTransaction).not.toHaveBeenCalled()
      expect(sessions).toHaveProperty('tx-hook')
      expect(req.transactionID).toBe('tx-hook')
    })

    it('preserves per-document errors when a document fails without killing the shared transaction', async () => {
      const { commitTransaction, collection, req, rollbackTransaction, updatedCalls } =
        createHarness({
          beforeChange: [
            async ({ data, originalDoc }) => {
              if (originalDoc.id === 'doc-a') {
                throw new Error('ordinary validation error')
              }
              return data
            },
          ],
        })

      const result = await updateOperation({
        collection,
        data: { title: 'updated' },
        overrideAccess: true,
        req,
        where: { id: { exists: true } },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]?.id).toBe('doc-b')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.id).toBe('doc-a')
      expect(result.errors[0]?.message).toBe('ordinary validation error')
      expect(updatedCalls).toEqual([{ id: 'doc-b', transactionID: 'tx-1' }])
      expect(commitTransaction).toHaveBeenCalledWith('tx-1')
      expect(rollbackTransaction).not.toHaveBeenCalled()
    })

    it('preserves existing behavior on non-transactional adapters', async () => {
      const { commitTransaction, collection, req, updatedCalls } = createHarness({
        beforeChange: [
          async ({ data, originalDoc }) => {
            if (originalDoc.id === 'doc-a') {
              throw new Error('non-tx error')
            }
            return data
          },
        ],
        transactional: false,
      })

      const result = await updateOperation({
        collection,
        data: { title: 'updated' },
        overrideAccess: true,
        req,
        where: { id: { exists: true } },
      })

      expect(result.docs.map((doc) => doc.id)).toEqual(['doc-b'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.id).toBe('doc-a')
      expect(updatedCalls).toEqual([{ id: 'doc-b', transactionID: undefined }])
      expect(commitTransaction).not.toHaveBeenCalled()
    })
  })

  describe('deleteOperation', () => {
    it('aborts without running later beforeDelete hooks or deleteMany when doc A kills the shared transaction and throws', async () => {
      const visitedIDs: string[] = []
      const { commitTransaction, collection, deletedBatches, req, rollbackTransaction } =
        createHarness({
          beforeDelete: [
            async ({ id, req: hookReq }) => {
              visitedIDs.push(String(id))
              if (id === 'doc-a') {
                await killTransaction(hookReq)
                throw new Error('nested delete hook failure')
              }
            },
          ],
        })

      await expect(
        deleteOperation({
          collection,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('nested delete hook failure')

      expect(visitedIDs).toEqual(['doc-a'])
      expect(deletedBatches).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('aborts without calling deleteMany when beforeDelete catches a nested failure that killed the transaction', async () => {
      const visitedIDs: string[] = []
      const { commitTransaction, collection, deletedBatches, req, rollbackTransaction } =
        createHarness({
          beforeDelete: [
            async ({ id, req: hookReq }) => {
              visitedIDs.push(String(id))
              if (id === 'doc-a') {
                try {
                  await killTransaction(hookReq)
                  throw new Error('nested delete hook failure')
                } catch {
                  // swallowed by hook
                }
              }
            },
          ],
        })

      await expect(
        deleteOperation({
          collection,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 was rolled back before the bulk delete completed.')

      expect(visitedIDs).toEqual(['doc-a'])
      expect(deletedBatches).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('aborts without running later afterDelete hooks or committing when afterDelete kills the transaction', async () => {
      const afterDeleteVisitedIDs: string[] = []
      const { commitTransaction, collection, deleteMany, req, rollbackTransaction } = createHarness(
        {
          afterDelete: [
            async ({ id, doc, req: hookReq }) => {
              afterDeleteVisitedIDs.push(String(id))
              if (id === 'doc-a') {
                await killTransaction(hookReq)
              }
              return doc
            },
          ],
        },
      )

      await expect(
        deleteOperation({
          collection,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 was rolled back before the bulk delete completed.')

      expect(afterDeleteVisitedIDs).toEqual(['doc-a'])
      // deleteMany ran once inside tx-1 (rolled back), never for payload-preferences outside tx
      expect(deleteMany).toHaveBeenCalledTimes(1)
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
    })

    it('rolls back only the owned transaction and preserves a replacement transactionID set by a hook', async () => {
      const { commitTransaction, collection, deletedBatches, req, rollbackTransaction, sessions } =
        createHarness({
          beforeDelete: [
            async ({ id, req: hookReq }) => {
              if (id === 'doc-a') {
                sessions['tx-replacement'] = { db: { name: 'tx-replacement' } }
                hookReq.transactionID = 'tx-replacement'
              }
            },
          ],
        })

      await expect(
        deleteOperation({
          collection,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-1 was rolled back before the bulk delete completed.')

      expect(deletedBatches).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
      expect(commitTransaction).not.toHaveBeenCalled()
      expect(sessions).not.toHaveProperty('tx-1')
      expect(sessions).toHaveProperty('tx-replacement')
      expect(req.transactionID).toBe('tx-replacement')
    })

    it('rolls back only the joined parent transaction and preserves a replacement transactionID set by a hook', async () => {
      const {
        beginTransaction,
        commitTransaction,
        collection,
        deletedBatches,
        req,
        rollbackTransaction,
        sessions,
      } = createHarness({
        beforeDelete: [
          async ({ id, req: hookReq }) => {
            if (id === 'doc-a') {
              sessions['tx-replacement'] = { db: { name: 'tx-replacement' } }
              hookReq.transactionID = 'tx-replacement'
            }
          },
        ],
      })

      sessions['tx-parent'] = { db: { name: 'tx-parent' } }
      req.transactionID = 'tx-parent'

      await expect(
        deleteOperation({
          collection,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('Transaction tx-parent was rolled back before the bulk delete completed.')

      expect(beginTransaction).not.toHaveBeenCalled()
      expect(deletedBatches).toEqual([])
      expect(rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(rollbackTransaction).toHaveBeenCalledWith('tx-parent')
      expect(commitTransaction).not.toHaveBeenCalled()
      expect(sessions).not.toHaveProperty('tx-parent')
      expect(sessions).toHaveProperty('tx-replacement')
      expect(req.transactionID).toBe('tx-replacement')
    })

    it('does not roll back a hook-installed transaction when started with disableTransaction', async () => {
      const {
        beginTransaction,
        commitTransaction,
        collection,
        deletedBatches,
        req,
        rollbackTransaction,
        sessions,
      } = createHarness({
        beforeOperation: [
          async ({ req: hookReq }) => {
            sessions['tx-hook'] = { db: { name: 'tx-hook' } }
            hookReq.transactionID = 'tx-hook'
            throw new Error('delete hook failed after opening tx-hook')
          },
        ],
      })

      await expect(
        deleteOperation({
          collection,
          disableTransaction: true,
          overrideAccess: true,
          req,
          where: { id: { exists: true } },
        }),
      ).rejects.toThrow('delete hook failed after opening tx-hook')

      expect(beginTransaction).not.toHaveBeenCalled()
      expect(deletedBatches).toEqual([])
      expect(rollbackTransaction).not.toHaveBeenCalled()
      expect(commitTransaction).not.toHaveBeenCalled()
      expect(sessions).toHaveProperty('tx-hook')
      expect(req.transactionID).toBe('tx-hook')
    })

    it('preserves per-document errors when a beforeDelete hook throws without killing the shared transaction', async () => {
      const { commitTransaction, collection, deletedBatches, req, rollbackTransaction } =
        createHarness({
          beforeDelete: [
            async ({ id }) => {
              if (id === 'doc-a') {
                throw new Error('blocked before delete')
              }
            },
          ],
        })

      const result = await deleteOperation({
        collection,
        overrideAccess: true,
        req,
        where: { id: { exists: true } },
      })

      expect(result.docs.map((doc) => doc.id)).toEqual(['doc-b'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.id).toBe('doc-a')
      expect(result.errors[0]?.message).toBe('blocked before delete')
      expect(deletedBatches[0]).toEqual({ ids: ['doc-b'], transactionID: 'tx-1' })
      expect(commitTransaction).toHaveBeenCalledWith('tx-1')
      expect(rollbackTransaction).not.toHaveBeenCalled()
    })

    it('preserves existing behavior on non-transactional adapters', async () => {
      const { commitTransaction, collection, deletedBatches, req } = createHarness({
        beforeDelete: [
          async ({ id }) => {
            if (id === 'doc-a') {
              throw new Error('non-tx delete error')
            }
          },
        ],
        transactional: false,
      })

      const result = await deleteOperation({
        collection,
        overrideAccess: true,
        req,
        where: { id: { exists: true } },
      })

      expect(result.docs.map((doc) => doc.id)).toEqual(['doc-b'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.id).toBe('doc-a')
      expect(deletedBatches[0]).toEqual({ ids: ['doc-b'], transactionID: undefined })
      expect(commitTransaction).not.toHaveBeenCalled()
    })
  })
})
