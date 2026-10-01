import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { resolveBranchDelete, setBranchDeleteOperation } from './tombstone.js'

const branch = 'feature'
const collectionSlug = 'posts'
const docID = 'main-id'

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
        operations: new Map(),
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
