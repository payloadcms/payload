import path from 'path'
import { describe, beforeAll, afterAll, afterEach, beforeEach, it, expect } from 'vitest'
import { _internal_jobSystemGlobals, _internal_resetJobSystemGlobals, type Payload } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { clearAndSeedEverything } from './seed.js'
import { timeFreeze, timeTravel, waitUntilAutorunIsDone, withoutAutoRun } from './utilities.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Queues - scheduling, without automatic scheduling handling', () => {
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      'config.schedules.ts',
    ))
  })

  afterAll(async () => {
    // Ensure no new crons are scheduled
    _internal_jobSystemGlobals.shouldAutoRun = false
    _internal_jobSystemGlobals.shouldAutoSchedule = false
    // Wait 3 seconds to ensure all currently-running crons are done. If we shut down the db while a function is running, it can cause issues
    // Cron function runs may persist after a test has finished
    await wait(3000)
    // Now we can destroy the payload instance
    await payload.destroy()
    _internal_resetJobSystemGlobals()
  })

  afterEach(() => {
    _internal_resetJobSystemGlobals()
  })

  beforeEach(async () => {
    // Set autorun to false during seed process to ensure no crons are scheduled, which may affect the tests
    _internal_jobSystemGlobals.shouldAutoRun = false
    _internal_jobSystemGlobals.shouldAutoSchedule = false
    await clearAndSeedEverything(payload)
    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    if (data.token) {
      token = data.token
    }
    payload.config.jobs.deleteJobOnComplete = true
    _internal_jobSystemGlobals.shouldAutoRun = true
    _internal_jobSystemGlobals.shouldAutoSchedule = true
  })

  it('can auto-schedule through local API and autorun jobs', async () => {
    // Do not call payload.jobs.queue() - the `EverySecond` task should be scheduled here
    await payload.jobs.handleSchedules({ queue: 'autorunSecond' })

    // Do not call payload.jobs.run{silent: true})

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('can auto-schedule through local API and autorun jobs when passing allQueues', async () => {
    // Do not call payload.jobs.queue() - the `EverySecond` task should be scheduled here
    await payload.jobs.handleSchedules({ queue: 'autorunSecond', allQueues: true })

    // Do not call payload.jobs.run{silent: true})

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('should not auto-schedule through local API and autorun jobs when not passing queue and schedule is not set on the default queue', async () => {
    // Do not call payload.jobs.queue() - the `EverySecond` task should be scheduled here
    await payload.jobs.handleSchedules()

    // Do not call payload.jobs.run{silent: true})

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(0)
  })

  it('can auto-schedule through handleSchedules REST API and autorun jobs', async () => {
    // Do not call payload.jobs.queue() - the `EverySecond` task should be scheduled here
    await restClient.GET('/payload-jobs/handle-schedules?queue=autorunSecond', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    // Do not call payload.jobs.run({silent: true})

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('can auto-schedule through run REST API and autorun jobs', async () => {
    // Do not call payload.jobs.queue() - the `EverySecond` task should be scheduled here
    await restClient.GET('/payload-jobs/run?silent=true&allQueues=true', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('do not auto-schedule through run REST API when passing disableScheduling=true', async () => {
    // Do not call payload.jobs.queue() - the `EverySecond` task should be scheduled here
    await restClient.GET('/payload-jobs/run?silent=true&disableScheduling=true', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(0)
  })

  it('ensure scheduler does not schedule more jobs than needed if executed sequentially', async () => {
    await withoutAutoRun(async () => {
      for (let i = 0; i < 3; i++) {
        await payload.jobs.handleSchedules({ allQueues: true })
      }
    })

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('ensure scheduler max-one-job condition, by default, ignores jobs not scheduled by scheduler', async () => {
    await withoutAutoRun(async () => {
      for (let i = 0; i < 2; i++) {
        await payload.jobs.queue({
          task: 'EverySecond',
          queue: 'autorunSecond',
          input: {
            message: 'This task runs every second',
          },
        })
      }
      for (let i = 0; i < 3; i++) {
        await payload.jobs.handleSchedules({ allQueues: true })
      }
    })

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
      onlyScheduled: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(3)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('ensure scheduler max-one-job condition, respects jobs not scheduled by scheduler due to task setting onlyScheduled: false', async () => {
    timeFreeze()
    await withoutAutoRun(async () => {
      for (let i = 0; i < 2; i++) {
        await payload.jobs.queue({
          task: 'EverySecondMax2',
          input: {
            message: 'This task runs every second - max 2 per second',
          },
        })
      }
      for (let i = 0; i < 3; i++) {
        await payload.jobs.handleSchedules({ queue: 'default' })
      }
    })

    timeTravel(20) // Advance time to satisfy the waitUntil of newly scheduled jobs

    await payload.jobs.run({
      limit: 100,
      silent: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(2) // Would be 4 by default, if only scheduled jobs were respected in handleSchedules condition
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second - max 2 per second')
  })

  it('ensure scheduler does not schedule more jobs than needed if executed sequentially - max. 2 jobs configured', async () => {
    timeFreeze()
    for (let i = 0; i < 3; i++) {
      await payload.jobs.handleSchedules({ queue: 'default' })
    }

    // Advance time to satisfy the waitUntil of newly scheduled jobs
    timeTravel(20)

    // default queue is not scheduled to autorun
    await payload.jobs.run({
      silent: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(2)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second - max 2 per second')
  })

  it('ensure job is scheduled every second', async () => {
    timeFreeze()
    for (let i = 0; i < 3; i++) {
      await withoutAutoRun(async () => {
        // Call it twice to test that it only schedules one
        await payload.jobs.handleSchedules({ allQueues: true })
        await payload.jobs.handleSchedules({ allQueues: true })
      })
      // Advance time to satisfy the waitUntil of newly scheduled jobs
      timeTravel(20)

      await waitUntilAutorunIsDone({
        payload,
        queue: 'autorunSecond',
        onlyScheduled: true,
      })
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(3)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
  })

  it('ensure job is scheduled every second - max. 2 jobs configured', async () => {
    timeFreeze()

    for (let i = 0; i < 3; i++) {
      await withoutAutoRun(async () => {
        // Call it 3x to test that it only schedules two
        await payload.jobs.handleSchedules({ queue: 'default' })
        await payload.jobs.handleSchedules({ queue: 'default' })
        await payload.jobs.handleSchedules({ queue: 'default' })
      })

      // Advance time to satisfy the waitUntil of newly scheduled jobs
      timeTravel(20)

      // default queue is not scheduled to autorun => run manually
      await payload.jobs.run({
        silent: true,
      })
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
      where: {
        title: {
          equals: 'This task runs every second - max 2 per second',
        },
      },
    })

    expect(allSimples.totalDocs).toBe(6)
    expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second - max 2 per second')
  })

  it('should not auto-schedule through automatic crons if scheduler set to manual', async () => {
    // Autorun runs every second - so should definitely be done if we wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Should not flake, as we are expecting nothing to happen

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(0)
  })
})
