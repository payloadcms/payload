import type { Field, PayloadRequest, StringKeyOf, TypedJobs } from '../../../index.js'
import type { JobLog, RunningJob } from './workflowTypes.js'

export type TaskInputOutput = {
  input: object
  output: object
}

export type TaskHandlerArgs<
  TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput,
  TWorkflowSlug extends keyof TypedJobs['workflows'] = string,
> = {
  input: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks']
    ? TypedJobs['tasks'][TTaskSlugOrInputOutput]['input']
    : TTaskSlugOrInputOutput extends TaskInputOutput // Check if it's actually TaskInputOutput type
      ? TTaskSlugOrInputOutput['input']
      : never
  job: RunningJob<TWorkflowSlug>
  req: PayloadRequest
}

export type TaskHandlerResult<
  TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput,
> = {
  output: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks']
    ? TypedJobs['tasks'][TTaskSlugOrInputOutput]['output']
    : TTaskSlugOrInputOutput extends TaskInputOutput // Check if it's actually TaskInputOutput type
      ? TTaskSlugOrInputOutput['output']
      : never
  state?: 'failed' | 'succeeded'
}

export type SavedTaskResult<TTaskSlug extends keyof TypedJobs['tasks']> = {
  input: TypedJobs['tasks'][TTaskSlug]['input']
  output: TypedJobs['tasks'][TTaskSlug]['output']
} & Omit<JobLog, 'input' | 'output'>

export type SavedTaskResults = {
  [TTaskSlug in keyof TypedJobs['tasks']]: {
    [id: string]: SavedTaskResult<TTaskSlug>
  }
}

export type TaskHandler<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput> =
  (
    args: TaskHandlerArgs<TTaskSlugOrInputOutput>,
  ) =>
    | Promise<TaskHandlerResult<TTaskSlugOrInputOutput>>
    | TaskHandlerResult<TTaskSlugOrInputOutput>

export type TaskType = StringKeyOf<TypedJobs['tasks']>

// Extracts the type of `input` corresponding to each task
export type TaskInput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['input']

export type TaskOutput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['output']

export type TaskHandlerResults = {
  [TTaskSlug in keyof TypedJobs['tasks']]: {
    [id: string]: TaskHandlerResult<TTaskSlug>
  }
}

export type RunTaskFunction = <TTaskSlug extends keyof TypedJobs['tasks']>(args: {
  id: string
  input?: TaskInput<TTaskSlug>
  retries?: number
  task: TTaskSlug
}) => Promise<TaskOutput<TTaskSlug>>

export type RunInlineTaskFunction = <TTaskInput extends object, TTaskOutput extends object>(args: {
  id: string
  input?: TTaskInput
  retries?: number
  task: (args: { input: TTaskInput; job: RunningJob<any>; req: PayloadRequest }) =>
    | {
        output: TTaskOutput
        state?: 'failed' | 'succeeded'
      }
    | Promise<{ output: TTaskOutput; state?: 'failed' | 'succeeded' }>
}) => Promise<TTaskOutput>

export type TaskConfig<
  TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput = TaskType,
> = {
  /**
   * The function that should be responsible for running the job.
   * You can either pass a string-based path to the job function file, or the job function itself.
   *
   * If you are using large dependencies within your job, you might prefer to pass the string path
   * because that will avoid bundling large dependencies in your Next.js app.
   */
  handler: string | TaskHandler<TTaskSlugOrInputOutput> // TODO: Rename to handler
  /**
   * Define the input field schema - payload will generate a type for this schema.
   */
  inputSchema?: Field[]
  /**
   * Define a human-friendly label for this task.
   */
  label?: string
  /**
   * Function to be executed if the task fails.
   */
  onFail?: () => void
  /**
   * Function to be executed if the task succeeds.
   */
  onSuccess?: () => void
  /**
   * Define the output field schema - payload will generate a type for this schema.
   */
  outputSchema?: Field[]
  /**
   * Specify the number of times that this step should be retried if it fails.
   */
  retries?: number
  /**
   * Define a slug-based name for this job. This slug needs to be unique among both tasks and workflows.
   */
  slug: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] ? TTaskSlugOrInputOutput : string
}
