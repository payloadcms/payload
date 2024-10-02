import type { TaskConfig, TaskType } from './config/taskTypes.js'
import type { BaseJob, JobTasksStatus } from './config/workflowTypes.js'

type Args = {
  job: BaseJob
  tasksConfig: TaskConfig<TaskType>[]
}

export const getJobStatus = ({ job, tasksConfig }: Args): JobTasksStatus => {
  const tasksStatus: JobTasksStatus = {}

  // First, add (in order) the steps from the config to
  // our status map
  for (const loggedJob of job.log) {
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
  }

  return tasksStatus
}
