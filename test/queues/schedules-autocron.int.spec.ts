import { _internal_jobSystemGlobals, _internal_resetJobSystemGlobals } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import testConfig from './config.schedules-autocron.js'

let token: string

const { email, password } = devUser

_internal_jobSystemGlobals.shouldAutoRun = false
_internal_jobSystemGlobals.shouldAutoSchedule = false

test.suite({ config: testConfig })(
  'Queues - scheduling, with automatic scheduling handling',
  () => {
    test.afterAll(async () => {
      // Ensure no new crons are scheduled
      _internal_jobSystemGlobals.shouldAutoRun = false
      _internal_jobSystemGlobals.shouldAutoSchedule = false
      // Wait 3 seconds to ensure all currently-running crons are done. If we shut down the db while a function is running, it can cause issues
      // Cron function runs may persist after a test has finished
      await wait(3000)
      _internal_resetJobSystemGlobals()
    })

    test.afterEach(() => {
      _internal_jobSystemGlobals.shouldAutoRun = false
      _internal_jobSystemGlobals.shouldAutoSchedule = false
    })

    test.beforeEach(async ({ payload, restClient }) => {
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

    test('can auto-schedule through automatic crons and autorun jobs', async ({ payload }) => {
      // Do not call payload.jobs.run() or payload.jobs.handleSchedules() - payload should automatically schedule crons for auto-scheduling

      // Autorun and Autoschedule runs every second - so should have autorun at least twice after 3.5 seconds. Case with the lowest amount of jobs completed,
      // if autoschedule runs after the first autorun:
      // Second 1: Autorun runs => no jobs
      // Second 1: Autoschedule runs => scheduels 1 job
      // Second 2: Autorun runs => runs 1 job => 1
      // Second 2: Autoschedule runs => schedules 1 job
      // Second 3: Autorun runs => runs 1 job => 2
      // Second 3: Autoschedule runs => schedules 1 job
      // Status after 3.5 seconds: 2 jobs running, 1 job scheduled

      // Best case - most amounts of jobs completed:
      // Second 1: Autoschedule runs => schedules 1 job
      // Second 1: Autorun runs => runs 1 job => 1
      // Second 2: Autoschedule runs => schedules 1 job
      // Second 2: Autorun runs => runs 1 job => 2
      // Second 3: Autoschedule runs => schedules 1 job
      // Second 3: Autorun runs => runs 1 job => 3
      // Status after 3.5 seconds: 3 jobs running, no jobs scheduled
      const minJobsCompleted = 2
      const maxJobsCompleted = 3

      await new Promise((resolve) => setTimeout(resolve, 3500)) // 3 seconds + 0.5 seconds to ensure the last job has been completed

      const allSimples = await payload.find({
        collection: 'simple',
        limit: 100,
      })

      expect(allSimples.totalDocs).toBeGreaterThanOrEqual(minJobsCompleted)
      expect(allSimples.totalDocs).toBeLessThanOrEqual(maxJobsCompleted)
      expect(allSimples?.docs?.[0]?.title).toBe('This task runs every second')
    })
  },
)
