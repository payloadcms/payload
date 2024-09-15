import type { CollectionConfig } from '../../collections/config/types.js'
import type { Block } from '../../fields/config/types.js'
import type { Payload, PayloadRequest } from '../../types/index.js'

export type JobRunnerArgs<TStep> = {
  // TODO:
  // Alessio, please type this!
  job: unknown
  req: PayloadRequest
  step: TStep
}

export type JobRunnerResult = {
  state: 'failed' | 'succeeded'
}

export type JobRunner<TStep> = (
  args: JobRunnerArgs<TStep>,
) => JobRunnerResult | Promise<JobRunnerResult>

export type StepConfig<TStep = unknown> = {
  /**
   * Specify the number of times that this step should be retried if it fails.
   */
  retries?: number
  /**
   * The function that should be responsible for running the job.
   * You can either pass a string-based path to the job function file, or the job function itself.
   *
   * If you are using large dependencies within your job, you might prefer to pass the string path
   * because that will avoid bundling large dependencies in your Next.js app.
   */
  run: JobRunner<TStep> | string
  /**
   * Define the field schema corresponding to what data you'd like to save on this job step.
   * The schema config is a Payload Block (https://payloadcms.com/docs/fields/blocks) - which supports everything that Payload Blocks support.
   */
  schema: Block
}

export type JobConfig = {
  /**
   * Define a human-friendly label for this job.
   */
  label?: string
  /**
   * Optionally, define the queue name that this job should be tied to.
   * Defaults to "default".
   */
  queue?: string
  /**
   * Specify the number of times that this job should be retried if it fails.
   */
  retries?: number
  /**
   * Define a slug-based name for this job.
   */
  slug: string
  /**
   * Define the steps that should be taken when this job is executed.
   */
  steps: StepConfig[]
}

export type RunJobAccessArgs = {
  req: PayloadRequest
}

export type RunJobAccess = (args: RunJobAccessArgs) => boolean | Promise<boolean>

export type QueueConfig = {
  /**
   * Specify access control to determine who can interact with jobs.
   */
  access?: {
    /**
     * By default, all logged-in users can trigger jobs.
     */
    run?: RunJobAccess
  }
  /**
   * Define all jobs for the queue here.
   */
  jobs: JobConfig[]
  /**
   * Override any settings on the default Jobs collection. Accepts the default collection and allows you to return
   * a new collection.
   */
  jobsCollectionOverrides?: (args: { defaultJobsCollection: CollectionConfig }) => CollectionConfig
}
