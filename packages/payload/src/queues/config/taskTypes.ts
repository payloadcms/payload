import type { Field, PayloadRequest, TypedJobs } from '../../index.js'
import type { JobLog, RunningJob } from './workflowTypes.js'

export type TaskInputOutput = {
  input: object
  output: object
}

export type TaskRunnerArgs<
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

export type TaskRunnerResult<
  TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput,
> = {
  output: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks']
    ? TypedJobs['tasks'][TTaskSlugOrInputOutput]['output']
    : TTaskSlugOrInputOutput extends TaskInputOutput // Check if it's actually TaskInputOutput type
      ? TTaskSlugOrInputOutput['output']
      : never
  state: 'failed' | 'succeeded'
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

export type TaskRunner<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput> =
  (
    args: TaskRunnerArgs<TTaskSlugOrInputOutput>,
  ) => Promise<TaskRunnerResult<TTaskSlugOrInputOutput>> | TaskRunnerResult<TTaskSlugOrInputOutput>

export type TaskType = keyof TypedJobs['tasks']

// Extracts the type of `input` corresponding to each task
export type TaskInput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['input']

export type TaskOutput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['output']

export type TaskRunnerResults = {
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

export type TaskConfig<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput> =
  {
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
    run: string | TaskRunner<TTaskSlugOrInputOutput>
    /**
     * The function that should be responsible for running the job.
     * You can either pass a string-based path to the job function file, or the job function itself.
     *
     * If you are using large dependencies within your job, you might prefer to pass the string path
     * because that will avoid bundling large dependencies in your Next.js app.
     */
    slug: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] ? TTaskSlugOrInputOutput : string
    /**
     * Define a slug-based name for this job.
     */
  }
