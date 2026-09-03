import { expect, vitest } from 'vitest'

import { suite, test } from '../__helpers/int/vitest.js'
import { withoutAutoRun } from './utilities.js'

suite(
  'queues - postgres logs',
  {
    config: './config.postgreslogs.ts',
    cron: false,
    db: (adapter) => adapter.startsWith('postgres'),
  },
  () => {
    test('ensure running jobs uses minimal db calls', async ({ payload }) => {
      await withoutAutoRun(async () => {
        await payload.jobs.queue({
          task: 'DoNothingTask',
          input: {
            message: 'test',
          },
        })

        // Count every console log (= db call)
        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        const res = await payload.jobs.run({})

        expect(res).toEqual({
          jobStatus: { '1': { status: 'success' } },
          remainingJobsFromQueried: 0,
        })
        expect(consoleCount).toHaveBeenCalledTimes(16)
        consoleCount.mockRestore()
      })
    })
  },
)
