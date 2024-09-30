import type { CollectionConfig } from '../../collections/config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { TypedCollection, TypedJobs } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

export type TaskRunnerArgs<
  TTaskSlug extends keyof TypedJobs['tasks'],
  TWorkflowSlug extends keyof TypedJobs['workflows'] = string,
> = {
  input: TypedJobs['tasks'][TTaskSlug]['input']
  job: RunningJob<TWorkflowSlug>
  req: PayloadRequest
}

export type TaskRunnerResult<TTaskSlug extends keyof TypedJobs['tasks']> = {
  output: TypedJobs['tasks'][TTaskSlug]['output']
  state: 'failed' | 'succeeded'
}

export type BaseJob = {
  completedAt?: string
  error?: unknown
  hasError?: boolean
  id: number | string
  input?: any
  log: {
    completedAt: string
    error?: unknown
    executedAt: string
    input?: any
    output?: any
    state: 'failed' | 'succeeded'
    taskID: string
    taskSlug: string
  }[]
  processing?: boolean
  queue: string
  seenByWorker?: boolean
  waitUntil?: string
  workflowSlug: string
}

export type TaskRunner<TTaskSlug extends keyof TypedJobs['tasks']> = (
  args: TaskRunnerArgs<TTaskSlug>,
) => Promise<TaskRunnerResult<TTaskSlug>> | TaskRunnerResult<TTaskSlug>

export type TaskType = keyof TypedJobs['tasks']

export type WorkflowTypes = keyof TypedJobs['workflows']

// Extracts the type of `input` corresponding to each task
type TaskInput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['input']

type TaskOutput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['output']

type TaskRunnerResults = {
  [TTaskSlug in keyof TypedJobs['tasks']]: {
    [id: string]: TaskRunnerResult<TTaskSlug>
  }
}

export type RunTaskFunction = <TTaskSlug extends keyof TypedJobs['tasks']>(args: {
  id: string
  input?: TaskInput<TTaskSlug>
  retries?: number
  task: TTaskSlug
}) => Promise<TaskOutput<TTaskSlug>>

export type RunningJob<TWorkflowSlug extends keyof TypedJobs['workflows']> = {
  input: TypedJobs['workflows'][TWorkflowSlug]['input']
  tasks: TaskRunnerResults
} & TypedCollection['payload-jobs']

export type WorkflowControlFlow<TWorkflowSlug extends keyof TypedJobs['workflows']> = (args: {
  job: RunningJob<TWorkflowSlug>
  runTask: RunTaskFunction
}) => Promise<void>

/**
 * Task IDs mapped to their status
 */
export type WorkflowTasksStatus = {
  [taskID: string]: {
    complete: boolean
    input: TaskInput<TaskType>
    output: TaskOutput<TaskType>
    retries: number
    taskConfig: TaskConfig
    totalTried: number
  }
}

export type WorkflowConfig<TWorkflowSlug extends keyof TypedJobs['workflows']> = {
  /**
   * You can either pass a string-based path to the workflow function file, or the workflow function itself.
   *
   * If you are using large dependencies within your workflow control flow, you might prefer to pass the string path
   * because that will avoid bundling large dependencies in your Next.js app.
   */
  controlFlowInJS: string | WorkflowControlFlow<TWorkflowSlug>
  //TODO: Implement this. This will be an alternative to controlFlowInJS that has
  // all tasks and their order defined in JSON
  controlFlowInJSON?: never
  /**
   * Define the input field schema
   */
  inputSchema?: Field[]
  /**
   * Define a human-friendly label for this job.
   */
  label?: string
  /**
   * Optionally, define the queue name that this workflow should be tied to.
   * Defaults to "default".
   */
  queue?: string
  /**
   * Define a slug-based name for this job.
   */
  slug: TWorkflowSlug // message "({} & string) |"  is ts black magic that is used to allow any string as slug, while still providing type narrowing & type suggestions
}

export type TaskConfig = {
  /**
   * Define the input field schema
   */
  inputSchema?: Field[]
  /**
   * Define a human-friendly label for this task.
   */
  label?: string
  onFail?: () => void
  onSuccess?: () => void
  /**
   * Define the output field schema
   */
  outputSchema?: Field[]
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
  run: string | TaskRunner<TaskType>
  /**
   * Define a slug-based name for this job.
   */
  slug: string
}

export type RunJobAccessArgs = {
  req: PayloadRequest
}

export type RunJobAccess = (args: RunJobAccessArgs) => boolean | Promise<boolean>

type AllWorkflowConfigs = {
  [TWorkflowSlug in keyof TypedJobs['workflows']]: WorkflowConfig<TWorkflowSlug>
}[keyof TypedJobs['workflows']]

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
  tasks: TaskConfig[]
  /**
   * Define all the workflows here. Workflows orchestrate the flow of multiple tasks.
   */
  workflows: AllWorkflowConfigs[]
}
