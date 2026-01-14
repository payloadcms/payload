import path from 'path'
import {
  _internal_jobSystemGlobals,
  _internal_resetJobSystemGlobals,
  getPayload,
  migrateCLI,
  type SanitizedConfig,
} from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { waitUntilAutorunIsDone } from './utilities.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Queues - CLI', () => {
  let config: SanitizedConfig
  beforeAll(async () => {
    ;({ config } = await initPayloadInt(dirname, undefined, false))
  })

  it('ensure consecutive getPayload call with cron: true will autorun jobs', async () => {
    const payload = await getPayload({
      config,
    })

    await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      queue: 'autorunSecond',
      input: {
        message: 'hello!',
      },
    })

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
    // Now we can destroy the payload instance
    await _payload2.destroy()
    await payload.destroy()
    _internal_resetJobSystemGlobals()
  })

  it('can run migrate CLI without jobs attempting to run', async () => {
    await migrateCLI({
      config,
      parsedArgs: {
        _: ['migrate'],
      },
    })

    // Wait 3 seconds to let potential autorun crons trigger
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Expect no errors. Previously, this would throw an "error: relation "payload_jobs" does not exist" error
    expect(true).toBe(true)
  })
})
