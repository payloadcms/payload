import type { AfterScheduleFn } from '../../config/types/index.js'

import { type JobStats, jobStatsGlobalSlug } from '../../config/global.js'

// JobStats['stats']['scheduledRuns]['queues'] but correct, handling the undefined cases
type JobStatsScheduledRuns = NonNullable<
  NonNullable<NonNullable<JobStats['stats']>['scheduledRuns']>['queues']
>[string]

export const defaultAfterSchedule: AfterScheduleFn = async ({ jobStats, queueable, req }) => {
  const existingQueuesConfig =
    jobStats.stats?.scheduledRuns?.queues?.[queueable.scheduleConfig.queue] || {}

  const queueConfig: JobStatsScheduledRuns = {
    ...existingQueuesConfig,
  }
  if (queueable.taskConfig) {
    ;(queueConfig.tasks ??= {})[queueable.taskConfig.slug] = {
      lastScheduledRun: new Date().toISOString(),
    }
  } else if (queueable.workflowConfig) {
    ;(queueConfig.workflows ??= {})[queueable.workflowConfig.slug] = {
      lastScheduledRun: new Date().toISOString(),
    }
  }

  // Add to payload-jobs-stats global regardless of the status
  await req.payload.db.updateGlobal({
    slug: jobStatsGlobalSlug,
    data: {
      ...(jobStats.stats || {}),
      stats: {
        ...(jobStats.stats || {}),
        scheduledRuns: {
          ...(jobStats.stats?.scheduledRuns || {}),
          queues: {
            ...(jobStats.stats?.scheduledRuns?.queues || {}),
            [queueable.scheduleConfig.queue]: queueConfig,
          },
        },
      },
    } as JobStats,
    req,
    returning: false,
  })
}
