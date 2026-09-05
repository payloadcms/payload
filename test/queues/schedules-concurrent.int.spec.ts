/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] */
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite({
  config: './config.schedules-concurrent.ts',
  cron: false,
  db: (adapter) => adapter === 'postgres',
})('Queues - concurrent scheduling', () => {
  test.afterEach(() => {
    vi.useRealTimers()
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
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(atTime('12:00'))

    // Initialize both queues through the scheduler. Each has one job due at 12:15.
    await payload.jobs.handleSchedules({ queue: 'default' })
    await payload.jobs.handleSchedules({ queue: 'other' })

    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      sort: 'queue',
    })

    expect(scheduledJobs.totalDocs).toBe(2)
    expect(scheduledJobs.docs).toMatchObject([
      { queue: 'default', waitUntil: atTime('12:15') },
      { queue: 'other', waitUntil: atTime('12:15') },
    ])

    // The 12:15 jobs already exist, so scheduling must skip both queues.
    vi.setSystemTime(atTime('12:15:01'))

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

    // The previous jobs are complete. Queue their 12:30 replacements, which cannot run yet.
    vi.setSystemTime(atTime('12:15:02'))

    const nextSchedules = await Promise.all([
      payload.jobs.handleSchedules({ queue: 'default' }),
      payload.jobs.handleSchedules({ queue: 'other' }),
    ])

    for (const result of nextSchedules) {
      expect(result.errored).toHaveLength(0)
      expect(result.queued).toHaveLength(1)
      expect(result.skipped).toHaveLength(0)
    }

    const nextJobs = await payload.find({
      collection: 'payload-jobs',
      sort: 'queue',
      where: {
        completedAt: { exists: false },
      },
    })

    expect(nextJobs.totalDocs).toBe(2)
    expect(nextJobs.docs).toMatchObject([
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
    const deleteJobOnComplete = payload.config.jobs.deleteJobOnComplete

    payload.config.jobs.deleteJobOnComplete = true
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(atTime('12:00'))

    try {
      const results = await Promise.all([
        payload.jobs.handleSchedules({ queue: 'default' }),
        payload.jobs.handleSchedules({ queue: 'default' }),
      ])

      for (const result of results) {
        expect(result.errored).toHaveLength(0)
      }

      const scheduledJobs = await payload.find({ collection: 'payload-jobs' })

      expect(scheduledJobs.totalDocs).toBe(1)
      expect(scheduledJobs.docs).toMatchObject([
        { queue: 'default', taskSlug: 'scheduledTask', waitUntil: atTime('12:15') },
      ])
      expect(results.flatMap((result) => result.queued)).toHaveLength(1)
      expect(results.flatMap((result) => result.skipped)).toHaveLength(1)

      vi.setSystemTime(atTime('12:16'))

      const run = await payload.jobs.run({ queue: 'default', silent: true })

      expect(Object.values(run.jobStatus ?? {})).toEqual([{ status: 'success' }])

      const remainingJobs = await payload.find({ collection: 'payload-jobs' })

      expect(remainingJobs.totalDocs).toBe(0)
    } finally {
      payload.config.jobs.deleteJobOnComplete = deleteJobOnComplete
    }
  })
})

function atTime(time: string): string {
  const [hours, minutes, seconds = '00'] = time.split(':')

  return `2026-01-01T${hours}:${minutes}:${seconds}.000Z`
}
