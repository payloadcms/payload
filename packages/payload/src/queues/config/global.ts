import type { GlobalConfig } from '../../globals/config/types.js'
import type { TaskSlug } from './types/taskTypes.js'
import type { WorkflowSlug } from './types/workflowTypes.js'

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
            [taskSlug: TaskSlug]: {
              lastScheduledRun: string
            }
          }
          workflows?: {
            [workflowSlug: WorkflowSlug]: {
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
export const getJobStatsGlobal: () => GlobalConfig = () => {
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
    versions: false,
  }
}
