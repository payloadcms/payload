import type { Job, SingleTaskStatus, WorkflowConfig } from '../../index.js'
import type { RetryConfig, TaskConfig } from '../config/types/taskTypes.js'
import type { TaskParent } from '../operations/runJobs/runJob/getRunTaskFunction.js'

export type TaskErrorArgs = {
  executedAt: Date
  input?: object
  job: Job
  message: string
  output?: object
  parent?: TaskParent
  retriesConfig: RetryConfig
  taskConfig?: TaskConfig<string>
  taskID: string
  taskSlug: string
  taskStatus: null | SingleTaskStatus<string>
  workflowConfig: WorkflowConfig
}

export type WorkflowErrorArgs = {
  job: Job
  message: string
  workflowConfig: WorkflowConfig
}

export class TaskError extends Error {
  args: TaskErrorArgs
  constructor(args: TaskErrorArgs) {
    super(args.message)
    this.args = args

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'TaskError'
    Object.defineProperty(this.constructor, 'name', { value: 'TaskError' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, TaskError.prototype)
  }
}
export class WorkflowError extends Error {
  args: WorkflowErrorArgs

  constructor(args: WorkflowErrorArgs) {
    super(args.message)
    this.args = args

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'WorkflowError'
    Object.defineProperty(this.constructor, 'name', { value: 'WorkflowError' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, WorkflowError.prototype)
  }
}

export class JobCancelledError extends Error {
  args: {
    job: Job
  }

  constructor(args: { job: Job }) {
    super(`Job ${args.job.id} was cancelled`)
    this.args = args

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'JobCancelledError'
    Object.defineProperty(this.constructor, 'name', { value: 'JobCancelledError' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, JobCancelledError.prototype)
  }
}
