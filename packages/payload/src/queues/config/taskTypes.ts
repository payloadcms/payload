import type { Field, PayloadRequest, TypedJobs } from '../../index.js'
import type { JobLog, RunningJob } from './workflowTypes.js'

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

export type SavedTaskResult<TTaskSlug extends keyof TypedJobs['tasks']> = {
  input: TypedJobs['tasks'][TTaskSlug]['input']
  output: TypedJobs['tasks'][TTaskSlug]['output']
} & Omit<JobLog, 'input' | 'output'>

export type SavedTaskResults = {
  [TTaskSlug in keyof TypedJobs['tasks']]: {
    [id: string]: SavedTaskResult<TTaskSlug>
  }
}

export type TaskRunner<TTaskSlug extends keyof TypedJobs['tasks']> = (
  args: TaskRunnerArgs<TTaskSlug>,
) => Promise<TaskRunnerResult<TTaskSlug>> | TaskRunnerResult<TTaskSlug>

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
