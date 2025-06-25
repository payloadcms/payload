import type { PayloadRequest, Where } from '../../../types/index.js'

/**
 * Gets all queued jobs that can be run. This means they either:
 * - failed but do not have a definitive error => can be retried
 * - are currently processing
 * - have not been started yet
 */
export async function countRunnableOrActiveJobsForQueue({
  queue,
  req,
  taskSlug,
  workflowSlug,
}: {
  queue: string
  req: PayloadRequest
  taskSlug?: string
  workflowSlug?: string
}): Promise<number> {
  const and: Where[] = [
    // TODO: Can we filter only jobs that have been created through the scheduling system?
    {
      queue: {
        equals: queue,
      },
    },

    {
      completedAt: { exists: false },
    },
    {
      error: { exists: false },
    },
  ]

  if (taskSlug) {
    and.push({
      taskSlug: {
        equals: taskSlug,
      },
    })
  } else if (workflowSlug) {
    and.push({
      workflowSlug: {
        equals: workflowSlug,
      },
    })
  }

  const runnableOrActiveJobsForQueue = await req.payload.db.count({
    collection: 'payload-jobs',
    req,
    where: {
      and,
    },
  })

  return runnableOrActiveJobsForQueue.totalDocs
}
