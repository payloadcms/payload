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
})

function atTime(time: string): string {
  const [hours, minutes, seconds = '00'] = time.split(':')

  return `2026-01-01T${hours}:${minutes}:${seconds}.000Z`
}
