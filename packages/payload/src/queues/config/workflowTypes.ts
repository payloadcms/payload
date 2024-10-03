import type { Field } from '../../fields/config/types.js'
import type { PayloadRequest, StringKeyOf, TypedCollection, TypedJobs } from '../../index.js'
import type {
  RunInlineTaskFunction,
  RunTaskFunction,
  TaskInput,
  TaskOutput,
  TaskType,
} from './taskTypes.js'

export type JobLog = {
  completedAt: string
  error?: unknown
  executedAt: string
  input?: any
  output?: any
  state: 'failed' | 'succeeded'
  taskID: string
  taskSlug: string
}

export type BaseJob = {
  completedAt?: string
  error?: unknown
  hasError?: boolean
  id: number | string
  input?: any
  log: JobLog[]
  processing?: boolean
  queue: string
  seenByWorker?: boolean
  taskSlug?: string
  taskStatus?: {
    // Added by afterRead hook
    [taskSlug: string]: {
      [taskID: string]: BaseJob['log'][0]
    }
  }
  waitUntil?: string
  workflowSlug?: string
}

export type WorkflowTypes = StringKeyOf<TypedJobs['workflows']>

export type RunningJob<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object> = {
  input: TWorkflowSlugOrInput extends keyof TypedJobs['workflows']
    ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input']
    : TWorkflowSlugOrInput
} & TypedCollection['payload-jobs']

export type RunningJobFromTask<TTaskSlug extends keyof TypedJobs['tasks']> = {
  input: TypedJobs['tasks'][TTaskSlug]['input']
} & TypedCollection['payload-jobs']

export type WorkflowHandler<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object> =
  (args: {
    job: RunningJob<TWorkflowSlugOrInput>
    req: PayloadRequest
    runTask: RunTaskFunction
    runTaskInline: RunInlineTaskFunction
  }) => Promise<void>

export type JobTaskStatus<T extends keyof TypedJobs['tasks']> = {
  complete: boolean
  input: TaskInput<T>
  output: TaskOutput<T>
  taskSlug: 'inline' | TaskType
  totalTried: number
}

/**
 * Task IDs mapped to their status
 */
export type JobTasksStatus = {
  [taskID: string]: JobTaskStatus<TaskType>
}

export type WorkflowConfig<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object> = {
  /**
   * You can either pass a string-based path to the workflow function file, or the workflow function itself.
   *
   * If you are using large dependencies within your workflow control flow, you might prefer to pass the string path
   * because that will avoid bundling large dependencies in your Next.js app.
   *
   *
   */
  handler: string | WorkflowHandler<TWorkflowSlugOrInput>
  //TODO: Add JSON-based control flow to handler later. This will add | array.  All tasks and their order defined in JSON
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
  slug: TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TWorkflowSlugOrInput : string
}

type AllWorkflowConfigs = {
  [TWorkflowSlug in keyof TypedJobs['workflows']]: WorkflowConfig<TWorkflowSlug>
}[keyof TypedJobs['workflows']]
