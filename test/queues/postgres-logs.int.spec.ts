import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { Job, Payload } from 'payload'

import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it, vitest } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { withoutAutoRun } from './utilities.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip
const failedJobClaimConstraint = 'payload_jobs_processing_token_must_be_null'

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
    await payload?.destroy()
  })

  it('ensure running jobs uses minimal db calls', async () => {
    await withoutAutoRun(async () => {
      await payload.jobs.queue({
        input: {
          message: 'test',
        },
        task: 'DoNothingTask',
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

  describe('transaction cleanup', () => {
    const createdJobIDs: Job['id'][] = []

    afterEach(async () => {
      const postgres = payload.db as unknown as PostgresAdapter

      for (const transactionID of Object.keys(postgres.sessions)) {
        await postgres.rollbackTransaction(transactionID)
      }

      await postgres.pool.query(
        `ALTER TABLE "payload_jobs" DROP CONSTRAINT IF EXISTS "${failedJobClaimConstraint}"`,
      )

      for (const jobID of createdJobIDs) {
        await payload.delete({ id: jobID, collection: 'payload-jobs' })
      }
      createdJobIDs.length = 0
    })

    it('should release the transaction when claiming jobs fails', async () => {
      await withoutAutoRun(async () => {
        const postgres = payload.db as unknown as PostgresAdapter

        const job = await payload.jobs.queue({
          input: {
            message: 'test failed claim',
          },
          task: 'DoNothingTask',
        })
        createdJobIDs.push(job.id)

        await postgres.pool.query(
          `ALTER TABLE "payload_jobs" DROP CONSTRAINT IF EXISTS "${failedJobClaimConstraint}"`,
        )
        await postgres.pool.query(
          `ALTER TABLE "payload_jobs" ADD CONSTRAINT "${failedJobClaimConstraint}" CHECK ("processing_token" IS NULL)`,
        )

        await expect(payload.jobs.run({ silent: true })).rejects.toThrow()

        expect(postgres.pool.totalCount - postgres.pool.idleCount).toBe(0)
      })
    })
  })
})
