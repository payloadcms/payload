import type { CollectionConfig } from '../../collections/config/types.js'
import type { Block } from '../../fields/config/types.js'

export type StepConfig = {
  /**
   * Specify the number of times that this step should be retried if it fails.
   */
  retries?: number
  /**
   * Pass a path to the function that you would like to run in order to process this job step.
   */
  run: string
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

export type QueueConfig = {
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
