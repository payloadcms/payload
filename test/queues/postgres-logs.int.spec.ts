/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { Job } from 'payload'

import { expect, vitest } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { withoutAutoRun } from './utilities.js'

const failedJobClaimConstraint = 'payload_jobs_processing_token_must_be_null'

test.suite(
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
          input: {
            message: 'test',
          },
          overrideAccess: true,
          task: 'DoNothingTask',
        })

        // Count every console log (= db call)
        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        const res = await payload.jobs.run({ overrideAccess: true })

        expect(res).toEqual({
          jobStatus: { '1': { status: 'success' } },
          remainingJobsFromQueried: 0,
        })
        expect(consoleCount).toHaveBeenCalledTimes(16)
        consoleCount.mockRestore()
      })
    })

    test.describe('transaction cleanup', () => {
      const createdJobIDs: Job['id'][] = []

      test.afterEach(async ({ payload }) => {
        const postgres = payload.db as unknown as PostgresAdapter

        for (const transactionID of Object.keys(postgres.sessions)) {
          await postgres.rollbackTransaction(transactionID)
        }

        await postgres.pool.query(
          `ALTER TABLE "payload_jobs" DROP CONSTRAINT IF EXISTS "${failedJobClaimConstraint}"`,
        )

        for (const jobID of createdJobIDs) {
          await payload.delete({ id: jobID, collection: 'payload-jobs', overrideAccess: true })
        }
        createdJobIDs.length = 0
      })

      test('should release the transaction when claiming jobs fails', async ({ payload }) => {
        await withoutAutoRun(async () => {
          const postgres = payload.db as unknown as PostgresAdapter

          const job = await payload.jobs.queue({
            input: {
              message: 'test failed claim',
            },
            overrideAccess: true,
            task: 'DoNothingTask',
          })
          createdJobIDs.push(job.id)

          await postgres.pool.query(
            `ALTER TABLE "payload_jobs" DROP CONSTRAINT IF EXISTS "${failedJobClaimConstraint}"`,
          )
          await postgres.pool.query(
            `ALTER TABLE "payload_jobs" ADD CONSTRAINT "${failedJobClaimConstraint}" CHECK ("processing_token" IS NULL)`,
          )

          await expect(payload.jobs.run({ overrideAccess: true, silent: true })).rejects.toThrow()

          expect(postgres.pool.totalCount - postgres.pool.idleCount).toBe(0)
        })
      })
    })
  },
)
