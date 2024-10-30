import type { Field } from '../../../fields/config/types.js'
import type { PayloadRequest, StringKeyOf, TypedCollection, TypedJobs } from '../../../index.js'
import type {
  RetryConfig,
  RunInlineTaskFunction,
  RunTaskFunctions,
  TaskInput,
  TaskOutput,
  TaskType,
} from './taskTypes.js'
import type { WorkflowJSON } from './workflowJSONTypes.js'

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
  taskSlug?: string
  taskStatus?: JobTaskStatus
  totalTried: number
  waitUntil?: string
  workflowSlug?: string
}

export type WorkflowTypes = StringKeyOf<TypedJobs['workflows']>

// TODO: Type job.taskStatus once available - for JSON-defined workflows
export type RunningJob<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object> = {
  input: TWorkflowSlugOrInput extends keyof TypedJobs['workflows']
    ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input']
    : TWorkflowSlugOrInput
  taskStatus: JobTaskStatus
} & Omit<TypedCollection['payload-jobs'], 'input' | 'taskStatus'>

export type RunningJobSimple<TWorkflowInput extends object> = {
  input: TWorkflowInput
} & TypedCollection['payload-jobs']

// Simplified version of RunningJob that doesn't break TypeScript (TypeScript seems to stop evaluating RunningJob when it's too complex)
export type RunningJobFromTask<TTaskSlug extends keyof TypedJobs['tasks']> = {
  input: TypedJobs['tasks'][TTaskSlug]['input']
} & TypedCollection['payload-jobs']

export type WorkflowHandler<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object> =
  (args: {
    inlineTask: RunInlineTaskFunction
    job: RunningJob<TWorkflowSlugOrInput>
    req: PayloadRequest
    tasks: RunTaskFunctions
  }) => Promise<void>

export type SingleTaskStatus<T extends keyof TypedJobs['tasks']> = {
  complete: boolean
  input: TaskInput<T>
  output: TaskOutput<T>
  taskSlug: TaskType
  totalTried: number
}

/**
 * Task IDs mapped to their status
 */
export type JobTaskStatus = {
  // Wrap in taskSlug to improve typing
  [taskSlug in TaskType]: {
    [taskID: string]: SingleTaskStatus<taskSlug>
  }
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
  handler:
    | string
    | WorkflowHandler<TWorkflowSlugOrInput>
    | WorkflowJSON<TWorkflowSlugOrInput extends object ? string : TWorkflowSlugOrInput>
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
   * Optionally, define the queue name that this workflow should be tied to.
   * Defaults to "default".
   */
  queue?: string
  /**
   * Specify the number of times that this workflow should be retried if it fails for any reason.
   */
  retries?: number | RetryConfig
  /**
   * Define a slug-based name for this job.
   */
  slug: TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TWorkflowSlugOrInput : string
}

type AllWorkflowConfigs = {
  [TWorkflowSlug in keyof TypedJobs['workflows']]: WorkflowConfig<TWorkflowSlug>
}[keyof TypedJobs['workflows']]
