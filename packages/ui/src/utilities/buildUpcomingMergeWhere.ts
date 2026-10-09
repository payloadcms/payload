import type { Where } from 'payload'

/**
 * Builds the query for a branch's upcoming scheduled merges.
 *
 * This client-safe helper mirrors `buildUpcomingScheduleWhere`: the same jobs
 * collection shape, filtered by the branch slug carried in the job input.
 */
export const buildUpcomingMergeWhere = ({ branchSlug }: { branchSlug: string }): Where => ({
  and: [
    { taskSlug: { equals: 'scheduleMerge' } },
    { completedAt: { exists: false } },
    { processingUntil: { exists: false } },
    { waitUntil: { greater_than: new Date() } },
    { 'input.branch': { equals: branchSlug } },
  ],
})
