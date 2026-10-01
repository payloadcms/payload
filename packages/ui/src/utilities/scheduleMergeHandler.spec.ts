import { beforeEach, expect, test, vi } from 'vitest'

import { buildUpcomingMergeWhere } from './buildUpcomingMergeWhere.js'
import {
  buildScheduledMergeCancellationWhere,
  getBranchMergeSummaryHandler,
  getUpcomingBranchMergesHandler,
  scheduleMergeHandler,
} from './scheduleMergeHandler.js'

const payloadMocks = vi.hoisted(() => ({
  canAccessAdmin: vi.fn(),
  Forbidden: class Forbidden extends Error {},
}))

vi.mock('payload', async (importOriginal) => ({
  ...(await importOriginal()),
  ...payloadMocks,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('should preserve the scheduling user auth collection in the queued merge', async () => {
  const waitUntil = new Date('2026-10-01T09:00:00.000Z')
  const queue = vi.fn().mockResolvedValue({ id: 'scheduled-merge' })
  const req = {
    i18n: { t: (key: string) => key },
    payload: {
      collections: {
        'secondary-users': {
          config: { access: { admin: () => true } },
        },
      },
      config: { admin: { user: 'users' } },
      findByID: vi.fn().mockResolvedValue({ id: 'branch-id', slug: 'campaign', status: 'open' }),
      jobs: { queue },
      logger: { error: vi.fn() },
    },
    t: (key: string) => key,
    user: { collection: 'secondary-users', id: 'secondary-user-id' },
  }

  await scheduleMergeHandler({
    branchID: 'branch-id',
    date: waitUntil,
    req,
  } as never)

  expect(queue).toHaveBeenCalledWith({
    input: {
      branch: 'campaign',
      changes: undefined,
      closeBranch: false,
      user: {
        relationTo: 'secondary-users',
        value: 'secondary-user-id',
      },
    },
    req,
    task: 'scheduleMerge',
    waitUntil,
  })
})

test('should only cancel an unclaimed and incomplete scheduled merge', () => {
  const where = buildScheduledMergeCancellationWhere({
    branchSlug: 'campaign',
    jobID: 'scheduled-job',
  })

  expect(where).toEqual({
    and: [
      { id: { equals: 'scheduled-job' } },
      { taskSlug: { equals: 'scheduleMerge' } },
      { completedAt: { exists: false } },
      { processingUntil: { exists: false } },
      { 'input.branch': { equals: 'campaign' } },
    ],
  })
})

test('should only select unclaimed and incomplete scheduled merges for a branch', () => {
  const where = buildUpcomingMergeWhere({ branchSlug: 'campaign' })

  expect(where).toMatchObject({
    and: [
      { taskSlug: { equals: 'scheduleMerge' } },
      { completedAt: { exists: false } },
      { processingUntil: { exists: false } },
      { waitUntil: { greater_than: expect.any(Date) } },
      { 'input.branch': { equals: 'campaign' } },
    ],
  })
})

test('should return an internal change summary after checking branch read access', async () => {
  const find = vi.fn().mockResolvedValue({
    docs: [
      { collectionSlug: 'posts', operation: 'update' },
      { globalSlug: 'header', operation: 'update' },
    ],
    totalDocs: 2,
  })
  const findByID = vi.fn().mockResolvedValue({ slug: 'campaign' })
  const req = {
    payload: { find, findByID },
    t: vi.fn(),
    user: { id: 'user-id' },
  }

  const result = await getBranchMergeSummaryHandler({
    branchID: 'branch-id',
    req,
    sampleLimit: 500,
  } as never)

  expect(payloadMocks.canAccessAdmin).toHaveBeenCalledWith({ req })
  expect(findByID).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'payload-branches',
      id: 'branch-id',
      overrideAccess: false,
      user: req.user,
    }),
  )
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'payload-branch-changes',
      limit: 200,
      overrideAccess: true,
      where: { branch: { equals: 'campaign' } },
    }),
  )
  expect(result).toEqual({
    docs: [
      { collectionSlug: 'posts', globalSlug: undefined, operation: 'update' },
      { collectionSlug: undefined, globalSlug: 'header', operation: 'update' },
    ],
    totalDocs: 2,
  })
})

test('should reject a merge summary for an unreadable branch', async () => {
  const find = vi.fn()
  const findByID = vi.fn().mockResolvedValue(null)
  const req = {
    payload: { find, findByID },
    t: vi.fn(),
    user: { id: 'user-id' },
  }

  await expect(
    getBranchMergeSummaryHandler({
      branchID: 'branch-id',
      req,
      sampleLimit: 200,
    } as never),
  ).rejects.toBeInstanceOf(payloadMocks.Forbidden)

  expect(find).not.toHaveBeenCalled()
})

test('should return upcoming merge jobs after checking branch read access', async () => {
  const find = vi.fn().mockResolvedValue({
    docs: [{ id: 'job-id', waitUntil: '2030-12-31T09:00:00.000Z' }, { id: 'missing-date' }],
  })
  const findByID = vi.fn().mockResolvedValue({ slug: 'campaign' })
  const req = {
    payload: { find, findByID },
    t: vi.fn(),
    user: { id: 'user-id' },
  }

  const result = await getUpcomingBranchMergesHandler({
    branchID: 'branch-id',
    req,
  } as never)

  expect(payloadMocks.canAccessAdmin).toHaveBeenCalledWith({ req })
  expect(findByID).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'payload-branches',
      id: 'branch-id',
      overrideAccess: false,
      user: req.user,
    }),
  )
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'payload-jobs',
      limit: 10,
      overrideAccess: true,
      sort: 'waitUntil',
    }),
  )
  expect(result).toEqual([{ id: 'job-id', waitUntil: '2030-12-31T09:00:00.000Z' }])
})
