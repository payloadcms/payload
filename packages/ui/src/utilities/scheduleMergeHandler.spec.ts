import { expect, test, vi } from 'vitest'

import {
  buildScheduledMergeCancellationWhere,
  buildUpcomingMergeWhere,
  scheduleMergeHandler,
} from './scheduleMergeHandler.js'

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
