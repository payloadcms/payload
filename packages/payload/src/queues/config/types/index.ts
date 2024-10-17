import type { CollectionConfig } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { TaskConfig } from './taskTypes.js'
import type { WorkflowConfig } from './workflowTypes.js'

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
  /**
   * Determine whether or not to delete a job after it has successfully completed.
   */
  deleteJobOnComplete?: boolean
  /**
   * Specify depth for retrieving jobs from the queue.
   * This should be as low as possible in order for job retrieval
   * to be as efficient as possible. Defaults to 0.
   */
  depth?: number
  /**
   * Override any settings on the default Jobs collection. Accepts the default collection and allows you to return
   * a new collection.
   */
  jobsCollectionOverrides?: (args: { defaultJobsCollection: CollectionConfig }) => CollectionConfig
  /**
   * Define all possible tasks here
   */
  tasks: TaskConfig<any>[]
  /**
   * Define all the workflows here. Workflows orchestrate the flow of multiple tasks.
   */
  workflows: WorkflowConfig<any>[]
}
