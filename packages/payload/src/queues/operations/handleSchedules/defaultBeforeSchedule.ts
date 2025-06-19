import type { Where } from '../../../types/index.js'
import type { BeforeScheduleFn } from '../../config/types/index.js'

export const defaultBeforeSchedule: BeforeScheduleFn = async ({ queueable, req }) => {
  // All tasks in that queue that are either currently processing or can be run
  const and: Where[] = [
    // TODO: Can we filter only jobs that have been created through the scheduling system?
    {
      queue: {
        equals: queueable.scheduleConfig.queue,
      },
    },

    {
      completedAt: { exists: false },
    },
    {
      error: { exists: false },
    },
  ]

  if (queueable.taskConfig) {
    and.push({
      taskSlug: {
        equals: queueable.taskConfig.slug,
      },
    })
  } else if (queueable.workflowConfig) {
    and.push({
      workflowSlug: {
        equals: queueable.workflowConfig.slug,
      },
    })
  }

  const activeTasksForQueue = await req.payload.db.count({
    collection: 'payload-jobs',
    req,
    where: {
      and,
    },
  })

  return {
    input: {},
    shouldSchedule: activeTasksForQueue.totalDocs === 0,
    waitUntil: queueable.waitUntil,
  }
}
