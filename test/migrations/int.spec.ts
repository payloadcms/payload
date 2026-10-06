import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite('Migration Locking', { config: './config.ts' }, () => {
  test('should reject a second instance while an unexpired lock is held', async ({ payload }) => {
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')
    const firstReq = await createPayloadRequest({ payload })
    const firstLock = await acquireMigrationLock({ payload, req: firstReq })

    expect(firstLock.acquired).toBe(true)

    try {
      const secondReq = await createPayloadRequest({ payload })
      const secondLock = await acquireMigrationLock({ payload, req: secondReq })
      const lockState = await payload.findGlobal({
        slug: 'payload-migrations-lock',
        overrideAccess: true,
      })

      expect(secondLock.acquired).toBe(false)
      expect(lockState.locked_by).toBe(firstLock.instanceId)
    } finally {
      await releaseMigrationLock({
        instanceId: firstLock.instanceId,
        payload,
        req: firstReq,
      })
    }
  })

  test('should acquire and release lock', async ({ payload }) => {
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')

    // Read initial lock state
    const initialLock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(initialLock.locked).toBe(false)

    // Acquire lock
    const req = await createPayloadRequest({ payload })
    const lockResult = await acquireMigrationLock({
      payload,
      req,
      timeout: 5000,
    })

    expect(lockResult.acquired).toBe(true)
    expect(lockResult.instanceId).toBeTruthy()

    // Check lock is set
    const activeLock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(activeLock.locked).toBe(true)
    expect(activeLock.locked_by).toBe(lockResult.instanceId)

    // Release lock
    await releaseMigrationLock({
      instanceId: lockResult.instanceId,
      payload,
      req,
    })

    // Check lock was released
    const finalLock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(finalLock.locked).toBe(false)
    expect(finalLock.locked_by).toBe(lockResult.instanceId) // Should still have instanceId from last holder
  })

  test('should respect existing locks and release properly', async ({ payload }) => {
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')

    // First instance acquires lock
    const req1 = await createPayloadRequest({ payload })
    const lock1 = await acquireMigrationLock({
      payload,
      req: req1,
      timeout: 5000,
    })

    expect(lock1.acquired).toBe(true)

    // Verify lock is held
    const lockState1 = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(lockState1.locked).toBe(true)
    expect(lockState1.locked_by).toBe(lock1.instanceId)
    expect(lockState1.expires_at).toBeTruthy()

    // Release lock
    await releaseMigrationLock({
      instanceId: lock1.instanceId,
      payload,
      req: req1,
    })

    // Verify lock is released
    const lockState2 = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(lockState2.locked).toBe(false)
    expect(lockState2.locked_by).toBe(lock1.instanceId) // Still has last holder ID

    // Second instance can now acquire
    const req2 = await createPayloadRequest({ payload })
    const lock2 = await acquireMigrationLock({
      payload,
      req: req2,
      timeout: 5000,
    })

    expect(lock2.acquired).toBe(true)
    expect(lock2.instanceId).not.toBe(lock1.instanceId)

    // Verify new lock holder
    const lockState3 = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(lockState3.locked).toBe(true)
    expect(lockState3.locked_by).toBe(lock2.instanceId)

    // Cleanup
    await releaseMigrationLock({
      instanceId: lock2.instanceId,
      payload,
      req: req2,
    })
  })

  test('should detect and clear stale locks', async ({ payload }) => {
    // Manually create a stale lock
    await payload.updateGlobal({
      slug: 'payload-migrations-lock',
      data: {
        expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
        locked: true,
        locked_at: new Date(Date.now() - 600000), // 10 minutes ago
        locked_by: 'crashed-instance',
      },
      overrideAccess: true,
    })

    // Try to acquire lock - should succeed because lock is stale
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')
    const req = await createPayloadRequest({ payload })
    const result = await acquireMigrationLock({
      payload,
      req,
      timeout: 5000,
    })

    expect(result.acquired).toBe(true)

    // Cleanup
    await releaseMigrationLock({
      instanceId: result.instanceId,
      payload,
      req,
    })
  })
})
