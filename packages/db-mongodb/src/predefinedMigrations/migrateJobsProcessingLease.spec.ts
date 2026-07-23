import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  collection: {
    createIndex: vi.fn().mockResolvedValue(undefined),
    dropIndex: vi.fn().mockResolvedValue(undefined),
    indexes: vi.fn(),
    updateMany: vi.fn().mockResolvedValue(undefined),
  },
  getSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../utilities/getEntity.js', () => ({
  getCollection: () => ({ Model: { collection: mocks.collection } }),
}))

vi.mock('../utilities/getSession.js', () => ({
  getSession: mocks.getSession,
}))

import { migrateJobsProcessingLease } from './migrateJobsProcessingLease.js'

describe('MongoDB jobs processing lease migration', () => {
  const req = { payload: { db: {} } } as PayloadRequest

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should migrate active jobs to expired leases', async () => {
    mocks.collection.indexes.mockResolvedValue([
      { key: { _id: 1 }, name: '_id_' },
      { key: { processing: 1 }, name: 'processing_1' },
    ])

    await migrateJobsProcessingLease({ direction: 'up', req })

    expect(mocks.collection.updateMany).toHaveBeenNthCalledWith(
      1,
      { processing: true },
      { $set: { processingUntil: new Date(0) } },
      { session: undefined },
    )
    expect(mocks.collection.updateMany).toHaveBeenNthCalledWith(
      2,
      {},
      { $unset: { processing: '' } },
      { session: undefined },
    )
    expect(mocks.collection.dropIndex).toHaveBeenCalledWith('processing_1', {
      session: undefined,
    })
    expect(mocks.collection.createIndex).toHaveBeenCalledWith(
      { processingUntil: 1 },
      { session: undefined },
    )
  })

  it('should restore the processing field when migrating down', async () => {
    mocks.collection.indexes.mockResolvedValue([
      { key: { _id: 1 }, name: '_id_' },
      { key: { processingUntil: 1 }, name: 'processingUntil_1' },
    ])

    await migrateJobsProcessingLease({ direction: 'down', req })

    expect(mocks.collection.updateMany).toHaveBeenNthCalledWith(
      1,
      {},
      { $set: { processing: false } },
      { session: undefined },
    )
    expect(mocks.collection.updateMany).toHaveBeenNthCalledWith(
      2,
      { processingUntil: { $ne: null } },
      { $set: { processing: true } },
      { session: undefined },
    )
    expect(mocks.collection.updateMany).toHaveBeenNthCalledWith(
      3,
      {},
      { $unset: { processingToken: '', processingUntil: '' } },
      { session: undefined },
    )
    expect(mocks.collection.dropIndex).toHaveBeenCalledWith('processingUntil_1', {
      session: undefined,
    })
    expect(mocks.collection.createIndex).toHaveBeenCalledWith(
      { processing: 1 },
      { session: undefined },
    )
  })
})
