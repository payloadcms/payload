import type { ClientSession } from 'mongoose'
import type { Payload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { migrateBranching } from './migrateBranching.js'

const legacyBranchFilter = {
  $or: [{ _branch: { $exists: false } }, { _branch: null }],
}

const createModel = () => ({
  collection: { updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }) },
  syncIndexes: vi.fn().mockResolvedValue([]),
})

const createPayload = () => {
  const posts = createModel()
  const postVersions = createModel()
  const globals = createModel()
  const globalVersions = createModel()
  const db = {
    collections: { posts },
    globals,
    versions: { header: globalVersions, posts: postVersions },
  }
  const payload = {
    config: {
      branching: {
        branchableCollections: new Set(['posts']),
        branchableGlobals: new Set(['header']),
        enabled: true,
      },
    },
    db,
    logger: { info: vi.fn() },
  } as unknown as Payload

  return { db, globalVersions, globals, payload, posts, postVersions }
}

describe('migrateBranching', () => {
  it('should backfill every branchable MongoDB store before synchronizing indexes', async () => {
    const { globalVersions, globals, payload, posts, postVersions } = createPayload()
    const session = {} as ClientSession

    await migrateBranching({ payload, session })

    expect(posts.collection.updateMany).toHaveBeenCalledWith(
      legacyBranchFilter,
      { $set: { _branch: 'main' } },
      { session },
    )
    expect(postVersions.collection.updateMany).toHaveBeenCalledWith(
      legacyBranchFilter,
      { $set: { _branch: 'main' } },
      { session },
    )
    expect(globals.collection.updateMany).toHaveBeenCalledWith(
      { ...legacyBranchFilter, globalType: { $in: ['header'] } },
      { $set: { _branch: 'main' } },
      { session },
    )
    expect(globalVersions.collection.updateMany).toHaveBeenCalledWith(
      legacyBranchFilter,
      { $set: { _branch: 'main' } },
      { session },
    )
    expect(posts.syncIndexes).toHaveBeenCalledOnce()
    expect(postVersions.syncIndexes).toHaveBeenCalledOnce()
    expect(globals.syncIndexes).toHaveBeenCalledOnce()
    expect(globalVersions.syncIndexes).toHaveBeenCalledOnce()
  })

  it('should retain old indexes when a backfill reports a uniqueness conflict', async () => {
    const { globalVersions, globals, payload, posts, postVersions } = createPayload()
    const conflict = new Error('duplicate key')

    posts.collection.updateMany.mockRejectedValue(conflict)

    await expect(migrateBranching({ payload })).rejects.toThrow('duplicate key')

    expect(posts.syncIndexes).not.toHaveBeenCalled()
    expect(postVersions.syncIndexes).not.toHaveBeenCalled()
    expect(globals.syncIndexes).not.toHaveBeenCalled()
    expect(globalVersions.syncIndexes).not.toHaveBeenCalled()
  })
})
