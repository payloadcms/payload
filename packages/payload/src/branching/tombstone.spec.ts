import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import {
  resolveBranchDelete,
  setBranchDeleteOperation,
  setConcurrentBranchDelete,
} from './tombstone.js'

const branch = 'feature'
const collectionSlug = 'posts'
const docID = 'main-id'

test('should restart the operation when the concurrent delete winner is no longer present', async () => {
  const mainDocument = { id: docID, title: 'Main document' }
  const retryError = Object.assign(new Error('retry the delete'), {
    errorLabels: ['TransientTransactionError'],
  })
  const removedWinner = {
    _branch: branch,
    _branchDocID: docID,
    _branchOp: 'delete',
    id: 'removed-winner-id',
    title: 'Main document',
  }
  const createdTombstone = { ...removedWinner, id: 'replacement-tombstone-id' }
  const findOne = vi.fn().mockResolvedValueOnce(null)
  const create = vi.fn().mockResolvedValue(createdTombstone)
  const req = {
    branch,
    context: {
      _branchState: {
        branch,
        deleted: new Map(),
        manifest: new Map(),
        manifestLoaded: true,
        rowIDs: new Map(),
      },
      _branchWritable: new Map([[branch, true]]),
    },
    payload: {
      config: {
        branching: {
          branchableCollections: new Set([collectionSlug]),
          enabled: true,
          maxShadowedIDs: 100,
        },
      },
      create: vi.fn().mockResolvedValue({}),
      db: {
        create,
        deleteMany: vi.fn().mockResolvedValue({ docs: [] }),
        findOne,
      },
    },
    query: { branch },
    transactionID: 'operation-transaction',
  } as unknown as PayloadRequest

  setConcurrentBranchDelete({
    branch,
    collectionSlug,
    doc: mainDocument,
    docID,
    req,
    retryError,
    winnerID: removedWinner.id,
  })
  await expect(
    resolveBranchDelete({
      collectionSlug,
      req,
      where: { id: { equals: docID } },
    }),
  ).rejects.toBe(retryError)

  const revalidationReq = findOne.mock.calls[0]![0].req as PayloadRequest

  expect(revalidationReq).not.toBe(req)
  expect(revalidationReq.transactionID).toBeUndefined()
  expect(findOne).toHaveBeenNthCalledWith(1, {
    branch: false,
    collection: collectionSlug,
    req: revalidationReq,
    where: {
      and: [
        { id: { equals: removedWinner.id } },
        { _branch: { equals: branch } },
        { _branchDocID: { equals: docID } },
        { _branchOp: { equals: 'delete' } },
      ],
    },
  })
  expect(create).not.toHaveBeenCalled()
})

test('should not let operation ownership authorise a different document', async () => {
  const otherDocID = 'other-main-id'
  const mainDocument = { id: otherDocID, title: 'Other main document' }
  const req = {
    branch,
    context: {
      _branchState: {
        branch,
        deleted: new Map(),
        manifest: new Map(),
        manifestLoaded: true,
        rowIDs: new Map(),
      },
      _branchWritable: new Map([[branch, true]]),
    },
    payload: {
      config: {
        branching: {
          branchableCollections: new Set([collectionSlug]),
          enabled: true,
          maxShadowedIDs: 100,
        },
      },
      create: vi.fn().mockResolvedValue({}),
      db: {
        create: vi.fn().mockResolvedValue({ ...mainDocument, _branch: branch, id: 'shadow-id' }),
        deleteMany: vi.fn().mockResolvedValue({ docs: [] }),
        findOne: vi.fn().mockResolvedValue(mainDocument),
      },
    },
    query: { branch },
    transactionID: 'operation-transaction',
  } as unknown as PayloadRequest

  setBranchDeleteOperation({
    branch,
    collectionSlug,
    docID,
    isTombstoneExpected: true,
    onResolved: vi.fn(),
    req,
    useAmbientTransaction: true,
  })

  await expect(
    resolveBranchDelete({
      collectionSlug,
      req,
      where: { id: { equals: otherDocID } },
    }),
  ).rejects.toMatchObject({
    message: 'Cannot delete an untouched branch document within an existing transaction.',
    status: 409,
  })
})
