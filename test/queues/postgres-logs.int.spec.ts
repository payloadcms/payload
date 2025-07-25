import type { Payload } from 'payload'

/* eslint-disable jest/require-top-level-describe */
import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { withoutAutoRun } from './utilities.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip

let payload: Payload

describePostgres('queues - postgres logs', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      'config.postgreslogs.ts',
    )
    assert(initialized.payload)
    assert(initialized.restClient)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('ensure running jobs uses minimal db calls', async () => {
    await withoutAutoRun(async () => {
      await payload.jobs.queue({
        task: 'DoNothingTask',
        input: {
          message: 'test',
        },
      })

      //  Count every console log (= db call)
      const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

      const res = await payload.jobs.run({})

      expect(res).toEqual({
        jobStatus: { '1': { status: 'success' } },
        remainingJobsFromQueried: 0,
      })
      expect(consoleCount).toHaveBeenCalledTimes(17) // Should be 17 sql calls if the optimizations are used. If not, this would be 22 calls
      consoleCount.mockRestore()
    })
  })
})
