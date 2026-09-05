import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite({
  config: './config.schedules-concurrent.ts',
  cron: false,
  db: (adapter) => adapter === 'postgres',
})('Queues - concurrent scheduling', () => {
  let deleteJobOnComplete: boolean | undefined

  test.beforeEach(({ payload }) => {
    deleteJobOnComplete = payload.config.jobs.deleteJobOnComplete
  })

  test.afterEach(({ payload }) => {
    payload.config.jobs.deleteJobOnComplete = deleteJobOnComplete
  })

  /**
   * Different queues share one stats document. Each scheduler reads it, changes
   * its own queue's lastScheduledRun, and writes the whole document back.
   * If two schedulers do this at the same time, the last write can replace the
   * other queue's new timestamp with its old one.
   *
   * That old timestamp can make a replacement job due at 12:15 again, even though
   * its 12:15 job already finished. Both replacements should wait until 12:30.
   */
  test("should run each queue's scheduled task only once per cron interval", async ({
    payload,
  }) => {
    await withSystemTime('12:00', async () => {
      // Initialize both queues through the scheduler. Each has one job due at 12:15.
      const defaultSchedule = await payload.jobs.handleSchedules({ queue: 'default' })
      const otherSchedule = await payload.jobs.handleSchedules({ queue: 'other' })

      expect(defaultSchedule.queued).toHaveLength(1)
      expect(otherSchedule.queued).toHaveLength(1)
      expect([defaultSchedule.queued[0]?.job, otherSchedule.queued[0]?.job]).toMatchObject([
        { queue: 'default', waitUntil: atTime('12:15') },
        { queue: 'other', waitUntil: atTime('12:15') },
      ])
    })

    await withSystemTime('12:15:01', async () => {
      // The 12:15 jobs already exist, so scheduling must skip both queues.
      const existingSchedules = await Promise.all([
        payload.jobs.handleSchedules({ queue: 'default' }),
        payload.jobs.handleSchedules({ queue: 'other' }),
      ])

      for (const result of existingSchedules) {
        expect(result.errored).toHaveLength(0)
        expect(result.queued).toHaveLength(0)
        expect(result.skipped).toHaveLength(1)
      }

      const firstRun = await payload.jobs.run({ allQueues: true, silent: true })

      expect(Object.values(firstRun.jobStatus ?? {})).toEqual([
        { status: 'success' },
        { status: 'success' },
      ])
    })

    await withSystemTime('12:15:02', async () => {
      // The previous jobs are complete. Queue their 12:30 replacements, which cannot run yet.
      const nextSchedules = await Promise.all([
        payload.jobs.handleSchedules({ queue: 'default' }),
        payload.jobs.handleSchedules({ queue: 'other' }),
      ])

      for (const result of nextSchedules) {
        expect(result.errored).toHaveLength(0)
        expect(result.queued).toHaveLength(1)
        expect(result.skipped).toHaveLength(0)
      }

      expect(nextSchedules.map((result) => result.queued[0]?.job)).toMatchObject([
        { queue: 'default', waitUntil: atTime('12:30') },
        { queue: 'other', waitUntil: atTime('12:30') },
      ])

      const earlyRun = await payload.jobs.run({ allQueues: true, silent: true })

      expect(earlyRun.jobStatus ?? {}).toEqual({})

      const completedJobs = await payload.find({
        collection: 'payload-jobs',
        where: {
          completedAt: { exists: true },
        },
      })

      expect(completedJobs.totalDocs).toBe(2)
    })
  })

  /**
   * Two schedulers can check the same queue before either creates a job.
   * Both see "no job exists", so both create a job for the same 12:15 run.
   * Checking for a job and creating it are separate database calls, so the
   * check alone does not prevent duplicates.
   *
   * One scheduler should queue the job and the other should skip it.
   * The job should run once and then be deleted when it finishes.
   */
  test('should queue only one job when two schedulers handle the same queue concurrently', async ({
    payload,
  }) => {
    payload.config.jobs.deleteJobOnComplete = true

    await withSystemTime('12:00', async () => {
      const results = await Promise.all([
        payload.jobs.handleSchedules({ queue: 'default' }),
        payload.jobs.handleSchedules({ queue: 'default' }),
      ])

      for (const result of results) {
        expect(result.errored).toHaveLength(0)
      }

      const queued = results.flatMap((result) => result.queued)

      expect(queued).toHaveLength(1)
      expect(queued[0]?.job).toMatchObject({
        queue: 'default',
        taskSlug: 'scheduledTask',
        waitUntil: atTime('12:15'),
      })
      expect(results.flatMap((result) => result.skipped)).toHaveLength(1)
    })

    await withSystemTime('12:16', async () => {
      const run = await payload.jobs.run({ queue: 'default', silent: true })

      expect(Object.values(run.jobStatus ?? {})).toEqual([{ status: 'success' }])

      const remainingJobs = await payload.find({ collection: 'payload-jobs' })

      expect(remainingJobs.totalDocs).toBe(0)
    })
  })

  /**
   * Check schedules at 12:00, wait until 12:16, run the job, then immediately
   * check schedules again. The task should wait until 12:30 to run again.
   */
  test('should not run a scheduled task again immediately after it finishes', async ({
    payload,
  }) => {
    payload.config.jobs.deleteJobOnComplete = true

    await withSystemTime('12:00', async () => {
      const firstSchedule = await payload.jobs.handleSchedules({ queue: 'default' })

      expect(firstSchedule.queued).toHaveLength(1)
      expect(firstSchedule.queued[0]?.job).toMatchObject({
        queue: 'default',
        taskSlug: 'scheduledTask',
        waitUntil: atTime('12:15'),
      })
    })

    await withSystemTime('12:16', async () => {
      // Run the job due at 12:15.
      const firstRun = await payload.jobs.run({ queue: 'default', silent: true })
      const remainingJobs = await payload.find({ collection: 'payload-jobs' })

      expect(Object.values(firstRun.jobStatus ?? {})).toEqual([{ status: 'success' }])
      expect(remainingJobs.totalDocs).toBe(0)

      // Still 12:16: scheduling again should not make the task run again yet.
      const nextSchedule = await payload.jobs.handleSchedules({ queue: 'default' })

      expect(nextSchedule.queued).toHaveLength(1)
      expect(nextSchedule.queued[0]?.job).toMatchObject({
        queue: 'default',
        taskSlug: 'scheduledTask',
        waitUntil: atTime('12:30'),
      })

      const secondRun = await payload.jobs.run({ queue: 'default', silent: true })

      expect(Object.values(secondRun.jobStatus ?? {})).toEqual([])
    })
  })

  /**
   * autoRun checks schedules before every run. At 12:16, that extra check sees
   * the waiting job and saves 12:16 as the last check time before the job runs.
   * Scheduling again after it finishes then queues the next job for 12:30,
   * so the task does not run twice.
   */
  test('should not run a scheduled task twice when checking schedules before every run', async ({
    payload,
  }) => {
    payload.config.jobs.deleteJobOnComplete = true

    await withSystemTime('12:00', async () => {
      const firstSchedule = await payload.jobs.handleSchedules({ queue: 'default' })

      expect(firstSchedule.queued).toHaveLength(1)
      expect(firstSchedule.queued[0]?.job).toMatchObject({
        queue: 'default',
        taskSlug: 'scheduledTask',
        waitUntil: atTime('12:15'),
      })

      const earlyRun = await payload.jobs.run({ queue: 'default', silent: true })

      expect(Object.values(earlyRun.jobStatus ?? {})).toEqual([])
    })

    await withSystemTime('12:16', async () => {
      // Check schedules before running the job due at 12:15.
      const existingSchedule = await payload.jobs.handleSchedules({ queue: 'default' })

      expect(existingSchedule.queued).toHaveLength(0)
      expect(existingSchedule.skipped).toHaveLength(1)

      const firstRun = await payload.jobs.run({ queue: 'default', silent: true })
      const remainingJobs = await payload.find({ collection: 'payload-jobs' })

      expect(Object.values(firstRun.jobStatus ?? {})).toEqual([{ status: 'success' }])
      expect(remainingJobs.totalDocs).toBe(0)

      // Still 12:16: scheduling again should not make the task run again yet.
      const nextSchedule = await payload.jobs.handleSchedules({ queue: 'default' })

      expect(nextSchedule.queued).toHaveLength(1)
      expect(nextSchedule.queued[0]?.job).toMatchObject({
        queue: 'default',
        taskSlug: 'scheduledTask',
        waitUntil: atTime('12:30'),
      })

      const secondRun = await payload.jobs.run({ queue: 'default', silent: true })

      expect(Object.values(secondRun.jobStatus ?? {})).toEqual([])
    })
  })
})

/** Freeze Date for this block, then restore real time even if an assertion fails. */
async function withSystemTime(time: string, run: () => Promise<void>): Promise<void> {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(atTime(time))

  try {
    await run()
  } finally {
    vi.useRealTimers()
  }
}

function atTime(time: string): string {
  const [hours, minutes, seconds = '00'] = time.split(':')

  return `2026-01-01T${hours}:${minutes}:${seconds}.000Z`
}
