import type { Field } from '../../fields/config/types.js'
import type { TypedCollection, TypedJobs } from '../../index.js'
import type {
  RunTaskFunction,
  SavedTaskResults,
  TaskConfig,
  TaskInput,
  TaskOutput,
  TaskRunnerResults,
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
  tasks?: {
    // Added by afterRead hook
    [taskSlug: string]: {
      [taskID: string]: BaseJob['log'][0]
    }
  }
  waitUntil?: string
  workflowSlug: string
}

export type WorkflowTypes = keyof TypedJobs['workflows']

export type RunningJob<TWorkflowSlug extends keyof TypedJobs['workflows']> = {
  input: TypedJobs['workflows'][TWorkflowSlug]['input']
  tasks: SavedTaskResults
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
