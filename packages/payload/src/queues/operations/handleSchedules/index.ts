import { Cron } from 'croner'

import type { Job } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BeforeScheduleFn, Queueable, ScheduleConfig } from '../../config/types/index.js'
import type { TaskConfig } from '../../config/types/taskTypes.js'
import type { WorkflowConfig } from '../../config/types/workflowTypes.js'

import { type JobStats, jobStatsGlobalSlug } from '../../config/global.js'
import { defaultAfterSchedule } from './defaultAfterSchedule.js'
import { defaultBeforeSchedule } from './defaultBeforeSchedule.js'

/**
 * On vercel, we cannot auto-schedule jobs using a Cron - instead, we'll use this same endpoint that can
 * also be called from Vercel Cron for auto-running jobs.
 *
 * The benefit of doing it like this instead of a separate endpoint is that we can run jobs immediately
 * after they are scheduled
 */
export async function handleSchedules({ req }: { req: PayloadRequest }) {
  const jobsConfig = req.payload.config.jobs

  const tasksWithSchedules =
    jobsConfig.tasks?.filter((task) => {
      return task.schedule?.length
    }) ?? []

  const workflowsWithSchedules =
    jobsConfig.workflows?.filter((workflow) => {
      return workflow.schedule?.length
    }) ?? []

  const queuesWithSchedules: {
    [queue: string]: {
      schedules: {
        scheduleConfig: ScheduleConfig
        taskConfig?: TaskConfig
        workflowConfig?: WorkflowConfig
      }[]
    }
  } = {}

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

  const stats: JobStats = await req.payload.db.findGlobal({
    slug: jobStatsGlobalSlug,
    req,
  })

  /**
   * Almost last step! Tasks and Workflows added here just need to be constraint-checkec (e.g max. 1 running task etc.),
   * before we can queue them
   */
  const workflowsToQueue: Queueable[] = []
  const tasksToQueue: Queueable[] = []

  // Need to know when that particular job was last scheduled in that particular queue

  for (const [queueName, { schedules }] of Object.entries(queuesWithSchedules)) {
    const queueScheduleStats = stats?.stats?.scheduledRuns?.queues?.[queueName]

    for (const schedulable of schedules) {
      const lastScheduledRun = schedulable.taskConfig
        ? queueScheduleStats?.tasks?.[schedulable.taskConfig.slug]?.lastScheduledRun
        : queueScheduleStats?.workflows?.[schedulable.workflowConfig?.slug ?? '']?.lastScheduledRun

      const nextRun = new Cron(schedulable.scheduleConfig.cron).nextRun(lastScheduledRun ?? null)

      if (!nextRun) {
        continue
      }

      if (schedulable.taskConfig) {
        tasksToQueue.push({
          scheduleConfig: schedulable.scheduleConfig,
          taskConfig: schedulable.taskConfig,
          waitUntil: nextRun,
        })
      } else if (schedulable.workflowConfig) {
        workflowsToQueue.push({
          scheduleConfig: schedulable.scheduleConfig,
          waitUntil: nextRun,
          workflowConfig: schedulable.workflowConfig,
        })
      }
    }
  }

  /**
   * Now queue, but check for constraints (= beforeSchedule) first.
   * Default constraint (= defaultBeforeSchedule): max. 1 running / scheduled task or workflow per queue
   */
  for (const queueable of [...tasksToQueue, ...workflowsToQueue]) {
    if (!queueable.taskConfig && !queueable.workflowConfig) {
      continue
    }

    const beforeScheduleFn = queueable.scheduleConfig.hooks?.beforeSchedule
    const afterScheduleFN = queueable.scheduleConfig.hooks?.afterSchedule

    try {
      const beforeScheduleResult: Awaited<ReturnType<BeforeScheduleFn>> = await (
        beforeScheduleFn ?? defaultBeforeSchedule
      )({
        // @ts-expect-error we know defaultBeforeSchedule will never call itself => pass null
        defaultBeforeSchedule: beforeScheduleFn ? defaultBeforeSchedule : null,
        jobStats: stats,
        queueable,
        req,
      })

      if (!beforeScheduleResult.shouldSchedule) {
        await (afterScheduleFN ?? defaultAfterSchedule)({
          // @ts-expect-error we know defaultAfterchedule will never call itself => pass null
          defaultAfterSchedule: afterScheduleFN ? defaultAfterSchedule : null,
          jobStats: stats,
          queueable,
          req,
          status: 'skipped',
        })
        continue
      }

      const job = (await req.payload.jobs.queue({
        input: beforeScheduleResult.input ?? {},
        queue: queueable.scheduleConfig.queue,
        req,
        task: queueable?.taskConfig?.slug,
        waitUntil: beforeScheduleResult.waitUntil,
        workflow: queueable.workflowConfig?.slug,
      } as Parameters<typeof req.payload.jobs.queue>[0])) as unknown as Job<false>

      await (afterScheduleFN ?? defaultAfterSchedule)({
        // @ts-expect-error we know defaultAfterchedule will never call itself => pass null
        defaultAfterSchedule: afterScheduleFN ? defaultAfterSchedule : null,
        job,
        jobStats: stats,
        queueable,
        req,
        status: 'success',
      })
    } catch (error) {
      await (afterScheduleFN ?? defaultAfterSchedule)({
        // @ts-expect-error we know defaultAfterchedule will never call itself => pass null
        defaultAfterSchedule: afterScheduleFN ? defaultAfterSchedule : null,
        error: error as Error,
        jobStats: stats,
        queueable,
        req,
        status: 'error',
      })
    }
  }
}
