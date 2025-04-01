import type { CollectionConfig } from '../../../index.js'
import type { Payload, PayloadRequest, Sort } from '../../../types/index.js'
import type { RunJobsArgs } from '../../operations/runJobs/index.js'
import type { TaskConfig } from './taskTypes.js'
import type { WorkflowConfig } from './workflowTypes.js'

export type CronConfig = {
  /**
   * The cron schedule for the job.
   * @default '* * * * *' (every minute).
   *
   * @example
   *     ┌───────────── minute (0 - 59)
   *     │ ┌───────────── hour (0 - 23)
   *     │ │ ┌───────────── day of the month (1 - 31)
   *     │ │ │ ┌───────────── month (1 - 12)
   *     │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
   *     │ │ │ │ │
   *     │ │ │ │ │
   *  - '0 * * * *' every hour at minute 0
   *  - '0 0 * * *' daily at midnight
   *  - '0 0 * * 0' weekly at midnight on Sundays
   *  - '0 0 1 * *' monthly at midnight on the 1st day of the month
   *  - '0/5 * * * *' every 5 minutes
   */
  cron?: string
  /**
   * The limit for the job. This can be overridden by the user. Defaults to 10.
   */
  limit?: number
  /**
   * The queue name for the job.
   */
  queue?: string
}

export type RunJobAccessArgs = {
  req: PayloadRequest
}

export type RunJobAccess = (args: RunJobAccessArgs) => boolean | Promise<boolean>

export type JobsConfig = {
  /**
   * Specify access control to determine who can interact with jobs.
   */
  access?: {
    /**
     * By default, all logged-in users can trigger jobs.
     */
    run?: RunJobAccess
  }
  /** Adds information about the parent job to the task log. This is useful for debugging and tracking the flow of tasks.
   *
   * In 4.0, this will default to `true`.
   *
   * @default false
   */
  addParentToTaskLog?: boolean
  /**
   * Queue cron jobs automatically on payload initialization.
   * @remark this property should not be used on serverless platforms like Vercel
   */
  autoRun?: ((payload: Payload) => CronConfig[] | Promise<CronConfig[]>) | CronConfig[]
  /**
   * Determine whether or not to delete a job after it has successfully completed.
   */
  deleteJobOnComplete?: boolean
  /**
   * Specify depth for retrieving jobs from the queue.
   * This should be as low as possible in order for job retrieval
   * to be as efficient as possible. Setting it to anything higher than
   * 0 will drastically affect performance, as less efficient database
   * queries will be used.
   *
   * @default 0
   */
  depth?: number
  /**
   * Override any settings on the default Jobs collection. Accepts the default collection and allows you to return
   * a new collection.
   */
  jobsCollectionOverrides?: (args: { defaultJobsCollection: CollectionConfig }) => CollectionConfig
  /**
   * Adjust the job processing order using a Payload sort string. This can be set globally or per queue.
   *
   * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
   *
   * @default all jobs for all queues will be executed in FIFO order.
   */
  processingOrder?:
    | ((args: RunJobsArgs) => Promise<Sort> | Sort)
    | {
        default?: Sort
        queues: {
          [queue: string]: Sort
        }
      }
    | Sort
  /**
   * By default, the job system uses direct database calls for optimal performance.
   * If you added custom hooks to your jobs collection, you can set this to true to
   * use the standard Payload API for all job operations. This is discouraged, as it will
   * drastically affect performance.
   *
   * @default false
   */
  runHooks?: boolean
  /**
   * A function that will be executed before Payload picks up jobs which are configured by the `jobs.autorun` function.
   * If this function returns true, jobs will be queried and picked up. If it returns false, jobs will not be run.
   * @param payload
   * @returns boolean
   */
  shouldAutoRun?: (payload: Payload) => boolean | Promise<boolean>
  /**
   * Define all possible tasks here
   */
  tasks: TaskConfig<any>[]
  /**
   * Define all the workflows here. Workflows orchestrate the flow of multiple tasks.
   */
  workflows?: WorkflowConfig<any>[]
}
