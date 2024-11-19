import type { RunningJob, TaskHandlerResult, TypedJobs } from '../../../index.js'
import type { RetryConfig, TaskHandlerArgsNoInput } from './taskTypes.js'

export type WorkflowStep<
  TTaskSlug extends keyof TypedJobs['tasks'],
  TWorkflowSlug extends keyof TypedJobs['workflows'],
> = {
  /**
   * If this step is completed, the workflow will be marked as completed
   */
  completesJob?: boolean
  condition?: (args: { job: RunningJob<TWorkflowSlug> }) => boolean
  /**
   * Each task needs to have a unique ID to track its status
   */
  id: string
  retries?: number | RetryConfig
} & (
  | {
      inlineTask?: (
        args: TaskHandlerArgsNoInput<TypedJobs['workflows'][TWorkflowSlug]['input']>,
      ) => Promise<TaskHandlerResult<TTaskSlug>> | TaskHandlerResult<TTaskSlug>
    }
  | {
      input: (args: { job: RunningJob<TWorkflowSlug> }) => TypedJobs['tasks'][TTaskSlug]['input']
      task: TTaskSlug
    }
)

type AllWorkflowSteps<TWorkflowSlug extends keyof TypedJobs['workflows']> = {
  [TTaskSlug in keyof TypedJobs['tasks']]: WorkflowStep<TTaskSlug, TWorkflowSlug>
}[keyof TypedJobs['tasks']]

export type WorkflowJSON<TWorkflowSlug extends keyof TypedJobs['workflows']> = Array<
  AllWorkflowSteps<TWorkflowSlug>
>
