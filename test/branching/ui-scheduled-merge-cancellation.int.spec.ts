/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the admin handler against the real Payload fixture. */
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { scheduleMergeHandler } from '../../packages/ui/src/utilities/scheduleMergeHandler.js'
import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'

const branch = 'halloween-updates'

test.suite('Branching: confirmed schedule cancellation', { config: './config.ts' }, () => {
  for (const field of ['processingUntil', 'completedAt'] as const) {
    test(`should refuse cancellation after ${field} is set`, async ({ payload }) => {
      const job = await payload.jobs.queue({
        overrideAccess: true,
        task: 'scheduleMerge',
        input: { branch },
        waitUntil: new Date('2030-01-01'),
      })

      await payload.update({
        collection: 'payload-jobs',
        id: job.id,
        data: { [field]: new Date().toISOString() },
        overrideAccess: true,
      })
      const req = await getRequest({ payload })
      const result = await scheduleMergeHandler({ deleteID: job.id, req })
      const retained = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        overrideAccess: true,
      })

      expect(result).toHaveProperty('error')
      expect(retained.id).toBe(job.id)
    })
  }

  test('should confirm cancellation only when the queued job is deleted', async ({ payload }) => {
    const job = await payload.jobs.queue({
      overrideAccess: true,
      task: 'scheduleMerge',
      input: { branch },
      waitUntil: new Date('2030-01-01'),
    })
    const req = await getRequest({ payload })
    const result = await scheduleMergeHandler({ deleteID: job.id, req })
    const removed = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(result).toHaveProperty('message')
    expect(result).not.toHaveProperty('error')
    expect(removed).toBeNull()
  })
})

async function getRequest({ payload }: { payload: Payload }) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: devUser.email } },
    overrideAccess: true,
  })

  return createPayloadRequest({ payload, user: { ...docs[0]!, collection: 'users' } })
}
