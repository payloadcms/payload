import type { PayloadRequest } from 'payload'

import { commitTransaction, killTransaction } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { getAfterDeleteHook, getDeleteFiles } from './afterDelete.js'

describe('cloud upload deletion', () => {
  it('should defer object deletion until the active transaction commits', async () => {
    const handleDelete = vi.fn().mockResolvedValue(undefined)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { commitTransaction: databaseCommit } },
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest
    const deleteFiles = getDeleteFiles({
      adapter: { handleDelete } as never,
      collection: { slug: 'media' } as never,
      collectionPrefix: 'media',
    })

    await deleteFiles({
      req,
      sourceDoc: { filename: 'document.txt', id: 1, prefix: 'documents' },
    })

    expect(handleDelete).not.toHaveBeenCalled()

    await commitTransaction(req)

    expect(databaseCommit).toHaveBeenCalledWith('transaction-id')
    expect(handleDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'document.txt',
        storageFilePath: 'documents/document.txt',
      }),
    )
  })

  it('should cancel deferred object deletion when the active transaction rolls back', async () => {
    const handleDelete = vi.fn().mockResolvedValue(undefined)
    const databaseRollback = vi.fn().mockResolvedValue(undefined)
    const req = {
      context: {},
      payload: { db: { rollbackTransaction: databaseRollback } },
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest
    const deleteFiles = getDeleteFiles({
      adapter: { handleDelete } as never,
      collection: { slug: 'media' } as never,
      collectionPrefix: 'media',
    })

    await deleteFiles({
      req,
      sourceDoc: { filename: 'document.txt', id: 1, prefix: 'documents' },
    })
    await killTransaction(req)

    expect(databaseRollback).toHaveBeenCalledWith('transaction-id')
    expect(handleDelete).not.toHaveBeenCalled()
  })

  it('should log deferred deletion errors without failing an already committed delete', async () => {
    const deletionError = new Error('Cloud deletion failed')
    const handleDelete = vi.fn().mockRejectedValue(deletionError)
    const databaseCommit = vi.fn().mockResolvedValue(undefined)
    const logError = vi.fn()
    const req = {
      context: {},
      payload: {
        db: { commitTransaction: databaseCommit },
        logger: { error: logError },
      },
      transactionID: 'transaction-id',
    } as unknown as PayloadRequest
    const afterDelete = getAfterDeleteHook({
      adapter: { handleDelete } as never,
      collection: { labels: { singular: 'Media' }, slug: 'media' } as never,
      collectionPrefix: 'media',
    })

    await afterDelete({ doc: { filename: 'document.txt', id: 1 }, req } as never)

    await expect(commitTransaction(req)).resolves.toBeUndefined()
    expect(logError).toHaveBeenCalledWith({
      err: deletionError,
      msg: 'There was an error while deleting files for collection media document 1.',
    })
  })
})
