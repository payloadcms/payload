import type { Job, SingleTaskStatus, WorkflowConfig } from '../../index.js'
import type { RetryConfig, TaskConfig } from '../config/types/taskTypes.js'
import type {
  RunTaskFunctionState,
  TaskParent,
} from '../operations/runJobs/runJob/getRunTaskFunction.js'

export type TaskErrorArgs = {
  executedAt: Date
  input?: object
  job: Job
  maxRetries: number
  message: string
  output?: object
  parent?: TaskParent
  retriesConfig: number | RetryConfig
  state: RunTaskFunctionState
  taskConfig?: TaskConfig<string>
  taskID: string
  taskSlug: string
  taskStatus: null | SingleTaskStatus<string>
}

export type WorkflowErrorArgs = {
  job: Job
  message: string
  state: RunTaskFunctionState
  workflowConfig: WorkflowConfig
}

export class TaskError extends Error {
  args: TaskErrorArgs
  constructor(args: TaskErrorArgs) {
    super(args.message)
    this.args = args

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, TaskError.prototype)
  }
}
export class WorkflowError extends Error {
  args: WorkflowErrorArgs

  constructor(args: WorkflowErrorArgs) {
    super(args.message)
    this.args = args

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, WorkflowError.prototype)
  }
}
