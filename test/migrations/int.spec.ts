import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Migration Locking', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (payload) {
      await payload.db.destroy()
    }
  })

  it('should acquire and release lock', async () => {
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')

    // Read initial lock state
    const initialLock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
    })

    expect(initialLock.locked).toBe(false)

    // Acquire lock
    const req = await createLocalReq({}, payload)
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
    })

    expect(activeLock.locked).toBe(true)
    expect(activeLock.locked_by).toBe(lockResult.instanceId)

    // Release lock
    await releaseMigrationLock({
      payload,
      req,
      instanceId: lockResult.instanceId,
    })

    // Check lock was released
    const finalLock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
    })

    expect(finalLock.locked).toBe(false)
    expect(finalLock.locked_by).toBe(lockResult.instanceId) // Should still have instanceId from last holder
  })

  it('should respect existing locks and release properly', async () => {
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')

    // First instance acquires lock
    const req1 = await createLocalReq({}, payload)
    const lock1 = await acquireMigrationLock({
      payload,
      req: req1,
      timeout: 5000,
    })

    expect(lock1.acquired).toBe(true)

    // Verify lock is held
    const lockState1 = await payload.findGlobal({
      slug: 'payload-migrations-lock',
    })

    expect(lockState1.locked).toBe(true)
    expect(lockState1.locked_by).toBe(lock1.instanceId)
    expect(lockState1.expires_at).toBeTruthy()

    // Release lock
    await releaseMigrationLock({
      payload,
      req: req1,
      instanceId: lock1.instanceId,
    })

    // Verify lock is released
    const lockState2 = await payload.findGlobal({
      slug: 'payload-migrations-lock',
    })

    expect(lockState2.locked).toBe(false)
    expect(lockState2.locked_by).toBe(lock1.instanceId) // Still has last holder ID

    // Second instance can now acquire
    const req2 = await createLocalReq({}, payload)
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
    })

    expect(lockState3.locked).toBe(true)
    expect(lockState3.locked_by).toBe(lock2.instanceId)

    // Cleanup
    await releaseMigrationLock({
      payload,
      req: req2,
      instanceId: lock2.instanceId,
    })
  })

  it('should detect and clear stale locks', async () => {
    // Manually create a stale lock
    await payload.updateGlobal({
      slug: 'payload-migrations-lock',
      data: {
        locked: true,
        locked_by: 'crashed-instance',
        locked_at: new Date(Date.now() - 600000), // 10 minutes ago
        expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    })

    // Try to acquire lock - should succeed because lock is stale
    const { acquireMigrationLock, releaseMigrationLock } = await import('payload')
    const req = await createLocalReq({}, payload)
    const result = await acquireMigrationLock({
      payload,
      req,
      timeout: 5000,
    })

    expect(result.acquired).toBe(true)

    // Cleanup
    await releaseMigrationLock({
      payload,
      req,
      instanceId: result.instanceId,
    })
  })
})
