import type { Job, TypedJobs } from '../../../index.js'
import type { RetryConfig, TaskHandlerArgsNoInput } from './taskTypes.js'

export type WorkflowStep<
  TTaskSlug extends keyof TypedJobs['tasks'],
  TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object = object,
> = {
  /**
   * If this step is completed, the workflow will be marked as completed
   */
  completesJob?: boolean
  condition?: (args: { job: Job<TWorkflowSlugOrInput> }) => boolean
  /**
   * Each task needs to have a unique ID to track its status
   */
  id: string
  /**
   * Specify the number of times that this workflow should be retried if it fails for any reason.
   *
   * @default By default, workflows are not retried and `retries` is `0`.
   */
  retries?: number | RetryConfig
} & (
  | {
      inlineTask: (
        args: TaskHandlerArgsNoInput<TWorkflowSlugOrInput>,
      ) => { output: object } | Promise<{ output: object }>
    }
  | {
      input: (args: { job: Job<TWorkflowSlugOrInput> }) => TypedJobs['tasks'][TTaskSlug]['input']
      task: TTaskSlug
    }
)

type AllWorkflowSteps<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object = object> =
  {
    [TTaskSlug in keyof TypedJobs['tasks']]: WorkflowStep<TTaskSlug, TWorkflowSlugOrInput>
  }[keyof TypedJobs['tasks']]

export type WorkflowJSON<
  TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object = object,
> = Array<AllWorkflowSteps<TWorkflowSlugOrInput>>
