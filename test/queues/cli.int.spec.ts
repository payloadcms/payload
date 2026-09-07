import { _internal_jobSystemGlobals, _internal_resetJobSystemGlobals, getPayload } from 'payload'
import { wait } from 'payload/shared'
import { expect } from 'vitest'

import { suite, test } from '../__helpers/int/vitest.js'
import { waitUntilAutorunIsDone } from './utilities.js'

suite('Queues - CLI', { config: './config.ts', cron: false }, () => {
  test('ensure consecutive getPayload call with cron: true will autorun jobs', async ({
    config,
    payload,
  }) => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      queue: 'autorunSecond',
      input: {
        message: 'hello!',
      },
    })

    const previousDropDatabase = process.env.PAYLOAD_DROP_DATABASE

    process.env.PAYLOAD_DROP_DATABASE = 'false'

    // Second instance of payload with the only purpose of running cron jobs
    const _payload2 = await getPayload({
      config,
      cron: true,
    })

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('hello!')

    // Shut down safely:
    // Ensure no new crons are scheduled
    _internal_jobSystemGlobals.shouldAutoRun = false
    _internal_jobSystemGlobals.shouldAutoSchedule = false
    // Wait 3 seconds to ensure all currently-running crons are done. If we shut down the db while a function is running, it can cause issues
    // Cron function runs may persist after a test has finished
    await wait(3000)
    // getPayload may return the fixture-owned instance for the same config. Leave that instance
    // connected for the fixture's next per-test reset; the file-scoped fixture destroys it later.
    if (_payload2 !== payload) {
      await _payload2.destroy()
    }
    _internal_resetJobSystemGlobals()

    if (previousDropDatabase === undefined) {
      delete process.env.PAYLOAD_DROP_DATABASE
    } else {
      process.env.PAYLOAD_DROP_DATABASE = previousDropDatabase
    }
  })

  test('can run migrate CLI without jobs attempting to run', async ({ cli }) => {
    await cli('migrate')

    // Wait 3 seconds to let potential autorun crons trigger
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Expect no errors. Previously, this would throw an "error: relation "payload_jobs" does not exist" error
    expect(true).toBe(true)
  })
})
