import { expect, test } from 'vitest'

import { buildUpcomingMergeWhere } from './buildUpcomingMergeWhere.js'
import { buildScheduledMergeCancellationWhere } from './scheduleMergeHandler.js'

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
