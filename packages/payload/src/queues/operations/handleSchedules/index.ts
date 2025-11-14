import { Cron } from 'croner'

import type { Job, TaskConfig, WorkflowConfig } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BeforeScheduleFn, Queueable, ScheduleConfig } from '../../config/types/index.js'

import { type JobStats, jobStatsGlobalSlug } from '../../config/global.js'
import { defaultAfterSchedule } from './defaultAfterSchedule.js'
import { defaultBeforeSchedule } from './defaultBeforeSchedule.js'
import { getQueuesWithSchedules } from './getQueuesWithSchedules.js'

export type HandleSchedulesResult = {
  errored: Queueable[]
  queued: Queueable[]
  skipped: Queueable[]
}

/**
 * On vercel, we cannot auto-schedule jobs using a Cron - instead, we'll use this same endpoint that can
 * also be called from Vercel Cron for auto-running jobs.
 *
 * The benefit of doing it like this instead of a separate endpoint is that we can run jobs immediately
 * after they are scheduled
 */
export async function handleSchedules({
  allQueues = false,
  queue: _queue,
  req,
}: {
  /**
   * If you want to schedule jobs from all queues, set this to true.
   * If you set this to true, the `queue` property will be ignored.
   *
   * @default false
   */
  allQueues?: boolean
  /**
   * If you want to only schedule jobs that are set to schedule in a specific queue, set this to the queue name.
   *
   * @default jobs from the `default` queue will be executed.
   */
  queue?: string
  req: PayloadRequest
}): Promise<HandleSchedulesResult> {
  const queue = _queue ?? 'default'
  const jobsConfig = req.payload.config.jobs
  const queuesWithSchedules = getQueuesWithSchedules({
    jobsConfig,
  })

  if (Object.keys(queuesWithSchedules).length === 0) {
    // No schedules defined => return early, before fetching jobsStatsGlobal, as the global may not even exist
    return {
      errored: [],
      queued: [],
      skipped: [],
    }
  }

  const stats: JobStats = await req.payload.db.findGlobal({
    slug: jobStatsGlobalSlug,
    req,
  })

  /**
   * Almost last step! Tasks and Workflows added here just need to be constraint-checked (e.g max. 1 running task etc.),
   * before we can queue them
   */
  const queueables: Queueable[] = []

  // Need to know when that particular job was last scheduled in that particular queue

  for (const [queueName, { schedules }] of Object.entries(queuesWithSchedules)) {
    if (!allQueues && queueName !== queue) {
      // If a queue is specified, only schedule jobs for that queue
      continue
    }
    for (const schedulable of schedules) {
      const queuable = checkQueueableTimeConstraints({
        queue: queueName,
        scheduleConfig: schedulable.scheduleConfig,
        stats,
        taskConfig: schedulable.taskConfig,
        workflowConfig: schedulable.workflowConfig,
      })
      if (queuable) {
        queueables.push(queuable)
      }
    }
  }

  const queued: Queueable[] = []
  const skipped: Queueable[] = []
  const errored: Queueable[] = []

  /**
   * Now queue, but check for constraints (= beforeSchedule) first.
   * Default constraint (= defaultBeforeSchedule): max. 1 running / scheduled task or workflow per queue
   */
  for (const queueable of queueables) {
    const { status } = await scheduleQueueable({
      queueable,
      req,
      stats,
    })
    switch (status) {
      case 'error':
        errored.push(queueable)
        break
      case 'skipped':
        skipped.push(queueable)
        break
      case 'success':
        queued.push(queueable)
        break
    }
  }
  return {
    errored,
    queued,
    skipped,
  }
}

export function checkQueueableTimeConstraints({
  queue,
  scheduleConfig,
  stats,
  taskConfig,
  workflowConfig,
}: {
  queue: string
  scheduleConfig: ScheduleConfig
  stats: JobStats
  taskConfig?: TaskConfig
  workflowConfig?: WorkflowConfig
}): false | Queueable {
  const queueScheduleStats = stats?.stats?.scheduledRuns?.queues?.[queue]

  const lastScheduledRun = taskConfig
    ? queueScheduleStats?.tasks?.[taskConfig.slug]?.lastScheduledRun
    : queueScheduleStats?.workflows?.[workflowConfig?.slug ?? '']?.lastScheduledRun

  const nextRun = new Cron(scheduleConfig.cron).nextRun(lastScheduledRun ?? undefined)

  if (!nextRun) {
    return false
  }
  return {
    scheduleConfig,
    taskConfig,
    waitUntil: nextRun,
    workflowConfig,
  }
}

export async function scheduleQueueable({
  queueable,
  req,
  stats,
}: {
  queueable: Queueable
  req: PayloadRequest
  stats: JobStats
}): Promise<{
  job?: Job<false>
  status: 'error' | 'skipped' | 'success'
}> {
  if (!queueable.taskConfig && !queueable.workflowConfig) {
    return {
      status: 'error',
    }
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
      return {
        status: 'skipped',
      }
    }

    const job = (await req.payload.jobs.queue({
      input: beforeScheduleResult.input ?? {},
      meta: {
        scheduled: true,
      },
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
    return {
      status: 'success',
    }
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
    return {
      status: 'error',
    }
  }
}
