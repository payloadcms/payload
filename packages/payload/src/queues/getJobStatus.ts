import type { TaskConfig } from './config/taskTypes.js'
import type {
  BaseJob,
  WorkflowConfig,
  WorkflowTasksStatus,
  WorkflowTypes,
} from './config/workflowTypes.js'

type Args = {
  job: BaseJob
  tasksConfig: TaskConfig[]
  workflowConfig: WorkflowConfig<WorkflowTypes>
}

export const getJobStatus = ({ job, tasksConfig, workflowConfig }: Args): WorkflowTasksStatus => {
  const tasksStatus: WorkflowTasksStatus = {}

  // First, add (in order) the steps from the config to
  // our status map
  job.log.forEach((loggedJob) => {
    const taskConfig = tasksConfig.find((task) => task.slug === loggedJob.taskSlug)
    if (!tasksStatus[loggedJob.taskID]) {
      tasksStatus[loggedJob.taskID] = {
        complete: loggedJob.state === 'succeeded',
        input: loggedJob.input,
        output: loggedJob.output,
        retries: taskConfig.retries ?? 0,
        taskConfig,
        totalTried: 1,
      }
    } else {
      const taskStatus = tasksStatus[loggedJob.taskID]
      taskStatus.totalTried += 1

      if (loggedJob.state === 'succeeded') {
        taskStatus.complete = true
      }
      tasksStatus[loggedJob.taskID] = taskStatus
    }
  })

  return tasksStatus
}
