import type { Config } from '../../config/types.js'
import type { GlobalConfig } from '../../globals/config/types.js'
import type { TaskType } from './types/taskTypes.js'
import type { WorkflowTypes } from './types/workflowTypes.js'

export const jobStatsGlobalSlug = 'payload-jobs-stats'

/**
 * Type for data stored in the payload-jobs-stats global.
 */
export type JobStats = {
  stats?: {
    scheduledRuns?: {
      queues?: {
        [queueSlug: string]: {
          tasks?: {
            [taskSlug: TaskType]: {
              lastScheduledRun: string
            }
          }
          workflows?: {
            [workflowSlug: WorkflowTypes]: {
              lastScheduledRun: string
            }
          }
        }
      }
    }
  }
}

/**
 * Global config for job statistics.
 */
export const getJobStatsGlobal: (config: Config) => GlobalConfig = (config) => {
  return {
    slug: jobStatsGlobalSlug,
    admin: {
      group: 'System',
      hidden: true,
    },
    fields: [
      {
        name: 'stats',
        type: 'json',
      },
    ],
  }
}
