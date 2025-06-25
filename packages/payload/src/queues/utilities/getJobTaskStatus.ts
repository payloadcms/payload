import type { Job } from '../../index.js'
import type { JobTaskStatus } from '../config/types/workflowTypes.js'

type Args = {
  jobLog: Job['log']
}

export const getJobTaskStatus = ({ jobLog }: Args): JobTaskStatus => {
  const taskStatus: JobTaskStatus = {}

  if (!jobLog || !Array.isArray(jobLog)) {
    return taskStatus
  }

  // First, add (in order) the steps from the config to
  // our status map
  for (const loggedJob of jobLog) {
    if (!taskStatus[loggedJob.taskSlug]) {
      taskStatus[loggedJob.taskSlug] = {}
    }
    if (!taskStatus[loggedJob.taskSlug]?.[loggedJob.taskID]) {
      taskStatus[loggedJob.taskSlug]![loggedJob.taskID] = {
        complete: loggedJob.state === 'succeeded',
        input: loggedJob.input,
        output: loggedJob.output,
        taskSlug: loggedJob.taskSlug,
        totalTried: 1,
      }
    } else {
      const newTaskStatus = taskStatus[loggedJob.taskSlug]![loggedJob.taskID]!
      newTaskStatus.totalTried += 1

      if (loggedJob.state === 'succeeded') {
        newTaskStatus.complete = true
        // As the task currently saved in taskStatus has likely failed and thus has no
        // Output data, we need to update it with the new data from the successful task
        newTaskStatus.output = loggedJob.output
        newTaskStatus.input = loggedJob.input
        newTaskStatus.taskSlug = loggedJob.taskSlug
      }
      taskStatus[loggedJob.taskSlug]![loggedJob.taskID] = newTaskStatus
    }
  }

  return taskStatus
}
