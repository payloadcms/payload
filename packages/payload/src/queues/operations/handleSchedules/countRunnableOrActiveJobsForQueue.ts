import type { PayloadRequest, Where } from '../../../types/index.js'
import type { TaskType } from '../../config/types/taskTypes.js'
import type { WorkflowTypes } from '../../config/types/workflowTypes.js'

/**
 * Gets all queued jobs that can be run. This means they either:
 * - failed but do not have a definitive error => can be retried
 * - are currently processing
 * - have not been started yet
 */
export async function countRunnableOrActiveJobsForQueue({
  onlyScheduled = false,
  queue,
  req,
  taskSlug,
  workflowSlug,
}: {
  /**
   * If true, this counts only jobs that have been created through the scheduling system.
   *
   * @default false
   */
  onlyScheduled?: boolean
  queue: string
  req: PayloadRequest
  taskSlug?: TaskType
  workflowSlug?: WorkflowTypes
}): Promise<number> {
  const and: Where[] = [
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
  if (onlyScheduled) {
    and.push({
      'meta.scheduled': {
        equals: true,
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
