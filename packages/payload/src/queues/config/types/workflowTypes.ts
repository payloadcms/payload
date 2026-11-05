import type { Field } from '../../../fields/config/types.js'
import type {
  Job,
  MaybePromise,
  PayloadRequest,
  StringKeyOf,
  TypedCollection,
  TypedJobs,
} from '../../../index.js'
import type { TaskParent } from '../../operations/runJobs/runJob/getRunTaskFunction.js'
import type { ScheduleConfig } from './index.js'
import type {
  RetryConfig,
  RunInlineTaskFunction,
  RunTaskFunctions,
  TaskInput,
  TaskOutput,
  TaskSlug,
} from './taskTypes.js'
import type { WorkflowJSON } from './workflowJSONTypes.js'

export type JobLog = {
  completedAt: string
  error?: unknown
  executedAt: string
  /**
   * ID added by the array field when the log is saved in the database
   */
  id: string
  input: Record<string, any>
  output?: Record<string, any>
  /**
   * Sub-tasks (tasks that are run within a task) will have a parent task ID
   */
  parent?: TaskParent
  state: 'failed' | 'succeeded'
  taskID: string
  taskSlug: TaskSlug
}

export type WorkflowSlug = StringKeyOf<TypedJobs['workflows']>

// Simplified version of Job that doesn't break TypeScript (TypeScript seems to stop evaluating Job when it's too complex)
export type JobFromTask<TTaskSlug extends keyof TypedJobs['tasks']> = {
  input: TypedJobs['tasks'][TTaskSlug]['input']
} & TypedCollection['payload-jobs']

export type WorkflowHandler<
  TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object = object,
> = (args: {
  inlineTask: RunInlineTaskFunction
  job: Job<TWorkflowSlugOrInput>
  req: PayloadRequest
  tasks: RunTaskFunctions
}) => MaybePromise<void>

export type SingleTaskStatus<T extends keyof TypedJobs['tasks']> = {
  complete: boolean
  input: TaskInput<T>
  output: TaskOutput<T>
  taskSlug: TaskSlug
  totalTried: number
}

/**
 * Task IDs mapped to their status
 */
export type JobTaskStatus = {
  // Wrap in taskSlug to improve typing
  [taskSlug in TaskSlug]: {
    [taskID: string]: SingleTaskStatus<taskSlug>
  }
}

/**
 * Concurrency configuration for workflows and tasks.
 * Controls how jobs with the same concurrency key are handled.
 */
export type ConcurrencyConfig<TInput = object> =
  | ((args: { input: TInput; queue: string }) => string)
  // Shorthand: key function only, exclusive defaults to true, supersedes defaults to false
  | {
      /**
       * Only one job with this key can run at a time.
       * Other jobs with the same key remain queued until the running job completes.
       * @default true
       */
      exclusive?: boolean
      /**
       * Function that returns a key to group related jobs.
       * Jobs with the same key are subject to concurrency rules.
       * The queue name is provided to allow for queue-specific concurrency keys if needed.
       */
      key: (args: { input: TInput; queue: string }) => string
      /**
       * When a new job is queued, delete older pending (not yet running) jobs with the same key.
       * Already-running jobs are not affected.
       * Useful when only the latest state matters (e.g., regenerating data after multiple rapid edits).
       * @default false
       */
      supersedes?: boolean
    }

export type WorkflowConfig<
  TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object = object,
> = {
  /**
   * Job concurrency controls for preventing race conditions.
   *
   * Can be an object with full options, or a shorthand function that just returns the key
   * (in which case exclusive defaults to true).
   */
  concurrency?: ConcurrencyConfig<
    TWorkflowSlugOrInput extends keyof TypedJobs['workflows']
      ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input']
      : TWorkflowSlugOrInput
  >
  /**
   * You can either pass a string-based path to the workflow function file, or the workflow function itself.
   *
   * If you are using large dependencies within your workflow control flow, you might prefer to pass the string path
   * because that will avoid bundling large dependencies in your Next.js app. Passing a string path is an advanced feature
   * that may require a sophisticated build pipeline in order to work.
   */
  handler: string | WorkflowHandler<TWorkflowSlugOrInput> | WorkflowJSON<TWorkflowSlugOrInput>
  /**
   * Define the input field schema  - payload will generate a type for this schema.
   */
  inputSchema?: Field[]
  /**
   * You can use interfaceName to change the name of the interface that is generated for this workflow. By default, this is "Workflow" + the capitalized workflow slug.
   */
  interfaceName?: string
  /**
   * Define a human-friendly label for this workflow.
   */
  label?: string
  /**
   * Optionally, define the default queue name that this workflow should be tied to.
   * Defaults to "default".
   * Can be overridden when queuing jobs via Local API.
   */
  queue?: string
  /**
   * You can define `retries` on the workflow level, which will enforce that the workflow can only fail up to that number of retries. If a task does not have retries specified, it will inherit the retry count as specified on the workflow.
   *
   * You can specify `0` as `workflow` retries, which will disregard all `task` retry specifications and fail the entire workflow on any task failure.
   * You can leave `workflow` retries as undefined, in which case, the workflow will respect what each task dictates as their own retry count.
   *
   * @default undefined. By default, workflows retries are defined by their tasks
   */
  retries?: number | RetryConfig | undefined
  /**
   * Allows automatically scheduling this workflow to run regularly at a specified interval.
   */
  schedule?: ScheduleConfig[]
  /**
   * Define a slug-based name for this job.
   */
  slug: TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TWorkflowSlugOrInput : string
}
