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
    /**
     * Internal bookkeeping for scheduled jobs: Payload reads and writes it
     * through the database adapter, so nothing needs access to it. Without
     * this, sanitizeGlobal falls back to defaultAccess and the global's REST
     * and GraphQL endpoints are open to every authenticated user.
     */
    access: {
      read: () => false,
      update: () => false,
    },
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
