import { describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { removeUnreferencedStagedObjects } from '../uploads/fileVersioning/cleanup.js'
import { runFileOperationPlan } from '../uploads/fileVersioning/fileOperationManager.js'
import { killOwnedTransaction, killTransaction } from './killTransaction.js'

const createUploadCollectionConfig = (): SanitizedCollectionConfig =>
  ({
    slug: 'media',
    flattenedFields: [],
    upload: {
      staticDir: '/tmp/media',
    },
    versions: false,
  }) as unknown as SanitizedCollectionConfig

describe('killTransaction', () => {
  it('deletes req.transactionID before running rollbackFileOperations compensation queries', async () => {
    const sessions: Record<string, { db: { name: string } }> = {
      'tx-1': { db: { name: 'tx-1' } },
    }
    const observedFindTransactionIDs: unknown[] = []
    const deleteObject = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn(async (id: number | string) => {
      delete sessions[String(id)]
    })
    const find = vi.fn(async ({ req: queryReq }: { req: PayloadRequest }) => {
      observedFindTransactionIDs.push(queryReq.transactionID)
      if (queryReq.transactionID !== undefined && !sessions[String(queryReq.transactionID)]) {
        throw new Error(`Transaction ${String(queryReq.transactionID)} is no longer active.`)
      }
      return { docs: [], totalDocs: 0 }
    })
    const loggerError = vi.fn()

    const req = {
      payload: {
        db: {
          find,
          rollbackTransaction,
          sessions,
        },
        logger: {
          error: loggerError,
        },
      },
      transactionID: 'tx-1',
    } as unknown as PayloadRequest

    const collection = createUploadCollectionConfig()

    await runFileOperationPlan({
      req,
      stage: async ({ trackStagedObject }) => {
        trackStagedObject({
          key: 'staged.png',
          remove: () =>
            removeUnreferencedStagedObjects({
              collection,
              objects: [{ key: 'staged.png', remove: deleteObject }],
              req,
            }),
        })
      },
      write: async () => 'written',
    })

    await killTransaction(req)

    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(req).not.toHaveProperty('transactionID')
    expect(observedFindTransactionIDs).toEqual([undefined])
    expect(deleteObject).toHaveBeenCalledTimes(1)
    expect(loggerError).not.toHaveBeenCalled()
  })

  it('still clears req.transactionID when rollbackTransaction throws', async () => {
    const removeStaged = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockRejectedValue(new Error('rollback failed'))

    const req = {
      payload: {
        db: {
          rollbackTransaction,
        },
        logger: {
          error: vi.fn(),
        },
      },
      transactionID: 'tx-1',
    } as unknown as PayloadRequest

    await runFileOperationPlan({
      req,
      stage: async ({ trackStagedObject }) => {
        trackStagedObject({
          key: 'staged.png',
          remove: removeStaged,
        })
      },
      write: async () => 'written',
    })

    await expect(killTransaction(req)).resolves.toBeUndefined()

    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(req).not.toHaveProperty('transactionID')
    expect(removeStaged).not.toHaveBeenCalled()
  })

  it('rolls back an owned transaction and compensates files without clobbering a replacement transactionID', async () => {
    const sessions: Record<string, { db: { name: string } }> = {
      'tx-1': { db: { name: 'tx-1' } },
      'tx-replacement': { db: { name: 'tx-replacement' } },
    }
    const observedFindTransactionIDs: unknown[] = []
    const deleteObject = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn(async (id: number | string) => {
      delete sessions[String(id)]
    })
    const find = vi.fn(async ({ req: queryReq }: { req: PayloadRequest }) => {
      observedFindTransactionIDs.push(queryReq.transactionID)
      if (queryReq.transactionID !== undefined && !sessions[String(queryReq.transactionID)]) {
        throw new Error(`Transaction ${String(queryReq.transactionID)} is no longer active.`)
      }
      return { docs: [], totalDocs: 0 }
    })

    const req = {
      payload: {
        db: {
          find,
          rollbackTransaction,
          sessions,
        },
        logger: {
          error: vi.fn(),
        },
      },
      transactionID: 'tx-1',
    } as unknown as PayloadRequest

    const collection = createUploadCollectionConfig()

    await runFileOperationPlan({
      req,
      stage: async ({ trackStagedObject }) => {
        trackStagedObject({
          key: 'staged.png',
          remove: () =>
            removeUnreferencedStagedObjects({
              collection,
              objects: [{ key: 'staged.png', remove: deleteObject }],
              req,
            }),
        })
      },
      write: async () => 'written',
    })

    req.transactionID = 'tx-replacement'

    await killOwnedTransaction({
      hadSession: true,
      req,
      transactionID: 'tx-1',
    })

    expect(rollbackTransaction).toHaveBeenCalledTimes(1)
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(sessions).not.toHaveProperty('tx-1')
    expect(sessions).toHaveProperty('tx-replacement')
    expect(req.transactionID).toBe('tx-replacement')
    expect(observedFindTransactionIDs).toEqual([undefined])
    expect(deleteObject).toHaveBeenCalledTimes(1)
  })

  it('rolls back a joined transaction without rolling back a replacement transactionID', async () => {
    const sessions: Record<string, { db: { name: string } }> = {
      'tx-parent': { db: { name: 'tx-parent' } },
      'tx-replacement': { db: { name: 'tx-replacement' } },
    }
    const rollbackTransaction = vi.fn(async (id: number | string) => {
      delete sessions[String(id)]
    })

    const req = {
      payload: {
        db: {
          rollbackTransaction,
          sessions,
        },
        logger: {
          error: vi.fn(),
        },
      },
      transactionID: 'tx-replacement',
    } as unknown as PayloadRequest

    await killOwnedTransaction({
      hadSession: true,
      req,
      transactionID: 'tx-parent',
    })

    expect(rollbackTransaction).toHaveBeenCalledTimes(1)
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-parent')
    expect(sessions).not.toHaveProperty('tx-parent')
    expect(sessions).toHaveProperty('tx-replacement')
    expect(req.transactionID).toBe('tx-replacement')
  })

  it('does not roll back an unrelated hook transaction when no operation transaction was opened or joined', async () => {
    const sessions: Record<string, { db: { name: string } }> = {
      'tx-hook': { db: { name: 'tx-hook' } },
    }
    const rollbackTransaction = vi.fn(async (id: number | string) => {
      delete sessions[String(id)]
    })

    const req = {
      payload: {
        db: {
          rollbackTransaction,
          sessions,
        },
        logger: {
          error: vi.fn(),
        },
      },
      transactionID: 'tx-hook',
    } as unknown as PayloadRequest

    await killOwnedTransaction({
      hadSession: false,
      req,
      transactionID: undefined,
    })

    expect(rollbackTransaction).not.toHaveBeenCalled()
    expect(sessions).toHaveProperty('tx-hook')
    expect(req.transactionID).toBe('tx-hook')
  })

  it('handles adapters without a sessions map when req.transactionID is replaced or cleared', async () => {
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)

    const replacedReq = {
      payload: {
        db: {
          rollbackTransaction,
        },
        logger: {
          error: vi.fn(),
        },
      },
      transactionID: 'tx-replacement',
    } as unknown as PayloadRequest

    await killOwnedTransaction({
      hadSession: false,
      req: replacedReq,
      transactionID: 'tx-parent',
    })

    expect(rollbackTransaction).toHaveBeenCalledTimes(1)
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-parent')
    expect(replacedReq.transactionID).toBe('tx-replacement')

    const clearedReq = {
      payload: {
        db: {
          rollbackTransaction,
        },
        logger: {
          error: vi.fn(),
        },
      },
    } as unknown as PayloadRequest

    await killOwnedTransaction({
      hadSession: false,
      req: clearedReq,
      transactionID: 'tx-parent',
    })

    expect(rollbackTransaction).toHaveBeenCalledTimes(1)
    expect(clearedReq).not.toHaveProperty('transactionID')
  })
})
