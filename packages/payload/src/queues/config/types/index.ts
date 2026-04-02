import type { CollectionConfig, Job } from '../../../index.js'
import type { MaybePromise, Payload, PayloadRequest, Sort } from '../../../types/index.js'
import type { RunJobsSilent } from '../../localAPI.js'
import type { RunJobsArgs } from '../../operations/runJobs/index.js'
import type { JobStats } from '../global.js'
import type { TaskConfig } from './taskTypes.js'
import type { WorkflowConfig } from './workflowTypes.js'

export type AutorunCronConfig = {
  /**
   * If you want to autoRUn jobs from all queues, set this to true.
   * If you set this to true, the `queue` property will be ignored.
   *
   * @default false
   */
  allQueues?: boolean
  /**
   * The cron schedule for the job.
   * @default '* * * * *' (every minute).
   *
   * @example
   *     ┌───────────── (optional) second (0 - 59)
   *     │ ┌───────────── minute (0 - 59)
   *     │ │ ┌───────────── hour (0 - 23)
   *     │ │ │ ┌───────────── day of the month (1 - 31)
   *     │ │ │ │ ┌───────────── month (1 - 12)
   *     │ │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
   *     │ │ │ │ │ │
   *     │ │ │ │ │ │
   *  - '* 0 * * * *' every hour at minute 0
   *  - '* 0 0 * * *' daily at midnight
   *  - '* 0 0 * * 0' weekly at midnight on Sundays
   *  - '* 0 0 1 * *' monthly at midnight on the 1st day of the month
   *  - '* 0/5 * * * *' every 5 minutes
   *  - '* * * * * *' every second
   */
  cron?: string
  /**
   * By default, the autorun will attempt to schedule jobs for tasks and workflows that have a `schedule` property, given
   * the queue name is the same.
   *
   * Set this to `true` to disable the scheduling of jobs automatically.
   *
   * @default false
   */
  disableScheduling?: boolean
  /**
   * The limit for the job. This can be overridden by the user. Defaults to 10.
   */
  limit?: number
  /**
   * The queue name for the job.
   *
   * @default 'default'
   */
  queue?: string
  /**
   * If set to true, the job system will not log any output to the console (for both info and error logs).
   * Can be an option for more granular control over logging.
   *
   * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
   *
   * @default false
   */
  silent?: RunJobsSilent
}

export type RunJobAccessArgs = {
  req: PayloadRequest
}

export type RunJobAccess = (args: RunJobAccessArgs) => MaybePromise<boolean>

export type QueueJobAccessArgs = {
  req: PayloadRequest
}

export type CancelJobAccessArgs = {
  req: PayloadRequest
}
export type CancelJobAccess = (args: CancelJobAccessArgs) => MaybePromise<boolean>
export type QueueJobAccess = (args: QueueJobAccessArgs) => MaybePromise<boolean>

export type SanitizedJobsConfig = {
  /**
   * If set to `true`, the job system is enabled and a payload-jobs collection exists.
   * This property is automatically set during sanitization.
   */
  enabled?: boolean
  /**
   * If set to `true`, at least one task or workflow has scheduling enabled.
   * This property is automatically set during sanitization.
   */
  scheduling?: boolean
  /**
   * If set to `true`, a payload-job-stats global exists.
   * This property is automatically set during sanitization.
   */
  stats?: boolean
} & JobsConfig
export type JobsConfig = {
  /**
   * Specify access control to determine who can interact with jobs.
   */
  access?: {
    /**
     * By default, all logged-in users can cancel jobs.
     */
    cancel?: CancelJobAccess
    /**
     * By default, all logged-in users can queue jobs.
     */
    queue?: QueueJobAccess
    /**
     * By default, all logged-in users can run jobs.
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
   * Allows you to configure cron jobs that automatically run queued jobs
   * at specified intervals. Note that this does not _queue_ new jobs - only
   * _runs_ jobs that are already in the specified queue.
   *
   * @remark this property should not be used on serverless platforms like Vercel
   */
  autoRun?: ((payload: Payload) => MaybePromise<AutorunCronConfig[]>) | AutorunCronConfig[]
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
   * @deprecated - this will be removed in 4.0
   */
  depth?: number
  /**
   * Enable concurrency controls for workflows and tasks.
   * When enabled, adds a `concurrencyKey` field to the jobs collection schema.
   * This allows workflows and tasks to use the `concurrency` option to prevent race conditions.
   *
   * **Important:** Enabling this may require a database migration depending on your database adapter,
   * as it adds a new indexed field to the jobs collection schema.
   *
   * @default false
   * @todo In 4.0, this will default to `true`.
   */
  enableConcurrencyControl?: boolean
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
   * @deprecated - this will be removed in 4.0
   */
  runHooks?: boolean
  /**
   * A function that will be executed before Payload picks up jobs which are configured by the `jobs.autorun` function.
   * If this function returns true, jobs will be queried and picked up. If it returns false, jobs will not be run.
   * @default undefined - if this function is not defined, jobs will be run - as if () => true was passed.
   * @param payload
   * @returns boolean
   */
  shouldAutoRun?: (payload: Payload) => MaybePromise<boolean>
  /**
   * Define all possible tasks here
   */
  tasks?: TaskConfig<any>[]
  /**
   * Define all the workflows here. Workflows orchestrate the flow of multiple tasks.
   */
  workflows?: WorkflowConfig<any>[]
}

export type Queueable = {
  scheduleConfig: ScheduleConfig
  taskConfig?: TaskConfig
  // If not set, queue it immediately
  waitUntil?: Date
  workflowConfig?: WorkflowConfig
}

export type BeforeScheduleFn = (args: {
  defaultBeforeSchedule: BeforeScheduleFn
  /**
   * payload-job-stats global data
   */
  jobStats: JobStats
  queueable: Queueable
  req: PayloadRequest
}) => MaybePromise<{
  input?: object
  shouldSchedule: boolean
  waitUntil?: Date
}>

export type AfterScheduleFn = (
  args: {
    defaultAfterSchedule: AfterScheduleFn
    /**
     * payload-job-stats global data. If the global does not exist, it will be null.
     */
    jobStats: JobStats | null
    queueable: Queueable
    req: PayloadRequest
  } & (
    | {
        error: Error
        job?: never
        status: 'error'
      }
    | {
        error?: never
        job: Job
        status: 'success'
      }
    | {
        error?: never
        job?: never
        /**
         * If the beforeSchedule hook returned `shouldSchedule: false`, this will be called with status `skipped`.
         */
        status: 'skipped'
      }
  ),
) => MaybePromise<void>

export type ScheduleConfig = {
  /**
   * The cron for scheduling the job.
   *
   * @example
   *     ┌───────────── (optional) second (0 - 59)
   *     │ ┌───────────── minute (0 - 59)
   *     │ │ ┌───────────── hour (0 - 23)
   *     │ │ │ ┌───────────── day of the month (1 - 31)
   *     │ │ │ │ ┌───────────── month (1 - 12)
   *     │ │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
   *     │ │ │ │ │ │
   *     │ │ │ │ │ │
   *  - '* 0 * * * *' every hour at minute 0
   *  - '* 0 0 * * *' daily at midnight
   *  - '* 0 0 * * 0' weekly at midnight on Sundays
   *  - '* 0 0 1 * *' monthly at midnight on the 1st day of the month
   *  - '* 0/5 * * * *' every 5 minutes
   *  - '* * * * * *' every second
   */
  cron: string
  hooks?: {
    /**
     * Functions that will be executed after the job has been successfully scheduled.
     *
     * @default By default, global update?? Unless global update should happen before
     */
    afterSchedule?: AfterScheduleFn
    /**
     * Functions that will be executed before the job is scheduled.
     * You can use this to control whether or not the job should be scheduled, or what input
     * data should be passed to the job.
     *
     * @default By default, this has one function that returns { shouldSchedule: true } if the following conditions are met:
     * - There currently is no job of the same type in the specified queue that is currently running
     * - There currently is no job of the same type in the specified queue that is scheduled to run in the future
     * - There currently is no job of the same type in the specified queue that failed previously but can be retried
     */
    beforeSchedule?: BeforeScheduleFn
  }
  /**
   * Queue to which the scheduled job will be added.
   */
  queue: string
}
