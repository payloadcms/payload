// @ts-strict-ignore
import type { TaskConfig, TaskType } from '../config/types/taskTypes.js'
import type { BaseJob, JobTaskStatus } from '../config/types/workflowTypes.js'

type Args = {
  jobLog: BaseJob['log']
  tasksConfig: TaskConfig<TaskType>[]
}

export const getJobTaskStatus = ({ jobLog }: Args): JobTaskStatus => {
  const taskStatus: JobTaskStatus = {}

  // First, add (in order) the steps from the config to
  // our status map
  for (const loggedJob of jobLog) {
    if (!taskStatus[loggedJob.taskSlug]) {
      taskStatus[loggedJob.taskSlug] = {}
    }
    if (!taskStatus[loggedJob.taskSlug][loggedJob.taskID]) {
      taskStatus[loggedJob.taskSlug][loggedJob.taskID] = {
        complete: loggedJob.state === 'succeeded',
        input: loggedJob.input,
        output: loggedJob.output,
        taskSlug: loggedJob.taskSlug,
        totalTried: 1,
      }
    } else {
      const newTaskStatus = taskStatus[loggedJob.taskSlug][loggedJob.taskID]
      newTaskStatus.totalTried += 1

      if (loggedJob.state === 'succeeded') {
        newTaskStatus.complete = true
        // As the task currently saved in taskStatus has likely failed and thus has no
        // Output data, we need to update it with the new data from the successful task
        newTaskStatus.output = loggedJob.output
        newTaskStatus.input = loggedJob.input
        newTaskStatus.taskSlug = loggedJob.taskSlug
      }
      taskStatus[loggedJob.taskSlug][loggedJob.taskID] = newTaskStatus
    }
  }

  return taskStatus
}
