import type { SanitizedJobsConfig, ScheduleConfig } from '../../config/types/index.js'
import type { TaskConfig } from '../../config/types/taskTypes.js'
import type { WorkflowConfig } from '../../config/types/workflowTypes.js'

type QueuesWithSchedules = {
  [queue: string]: {
    schedules: {
      scheduleConfig: ScheduleConfig
      taskConfig?: TaskConfig
      workflowConfig?: WorkflowConfig
    }[]
  }
}

export const getQueuesWithSchedules = ({
  jobsConfig,
}: {
  jobsConfig: SanitizedJobsConfig
}): QueuesWithSchedules => {
  const tasksWithSchedules =
    jobsConfig.tasks?.filter((task) => {
      return task.schedule?.length
    }) ?? []

  const workflowsWithSchedules =
    jobsConfig.workflows?.filter((workflow) => {
      return workflow.schedule?.length
    }) ?? []

  const queuesWithSchedules: QueuesWithSchedules = {}

  for (const task of tasksWithSchedules) {
    for (const schedule of task.schedule ?? []) {
      ;(queuesWithSchedules[schedule.queue] ??= { schedules: [] }).schedules.push({
        scheduleConfig: schedule,
        taskConfig: task,
      })
    }
  }
  for (const workflow of workflowsWithSchedules) {
    for (const schedule of workflow.schedule ?? []) {
      ;(queuesWithSchedules[schedule.queue] ??= { schedules: [] }).schedules.push({
        scheduleConfig: schedule,
        workflowConfig: workflow,
      })
    }
  }

  return queuesWithSchedules
}
