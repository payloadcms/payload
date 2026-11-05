import type { BaseDatabaseAdapter, Payload } from 'payload'

import { createRequire } from 'node:module'
import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite('Migration Locking', { config: './config.ts' }, () => {
  const connections: Array<() => Promise<void>> = []

  test.afterEach(async () => {
    await Promise.all(connections.splice(0).map((close) => close()))
  })

  test('should elect one owner during concurrent first-use initialization', async ({ payload }) => {
    const independent = await openIndependentAdapter({ payload })

    connections.push(independent.close)

    const adapters = [payload.db, independent.adapter]
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        adapters[index % 2].tryAcquireMigrationLock!({
          instanceId: `owner-${index}`,
          timeout: 300000,
        }),
      ),
    )

    expect(results.filter(({ acquired }) => acquired)).toHaveLength(1)
    expect(await countLockRecords({ payload })).toBe(1)
  })

  test('should elect one owner when an existing lock is released', async ({ payload }) => {
    const independent = await openIndependentAdapter({ payload })

    connections.push(independent.close)
    await payload.db.tryAcquireMigrationLock!({ instanceId: 'initial', timeout: 300000 })
    await payload.db.releaseMigrationLock!({ instanceId: 'initial' })

    const results = await Promise.all(
      [payload.db, independent.adapter].map((adapter, index) =>
        adapter.tryAcquireMigrationLock!({ instanceId: `owner-${index}`, timeout: 300000 }),
      ),
    )

    expect(results.filter(({ acquired }) => acquired)).toHaveLength(1)
    expect(await countLockRecords({ payload })).toBe(1)
  })

  test('should preserve a new owner when an expired owner releases', async ({ payload }) => {
    await payload.db.tryAcquireMigrationLock!({ instanceId: 'old-owner', timeout: 300000 })
    await payload.updateGlobal({
      slug: 'payload-migrations-lock',
      data: { expires_at: new Date(Date.now() - 1000).toISOString() },
      overrideAccess: true,
    })

    const independent = await openIndependentAdapter({ payload })

    connections.push(independent.close)

    expect(
      await independent.adapter.tryAcquireMigrationLock!({
        instanceId: 'new-owner',
        timeout: 300000,
      }),
    ).toEqual({ acquired: true })

    await payload.db.releaseMigrationLock!({ instanceId: 'old-owner' })

    const state = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      overrideAccess: true,
    })

    expect(state.locked).toBe(true)
    expect(state.locked_by).toBe('new-owner')
  })

  test('should skip migration up functions when acquisition loses', async ({ payload }) => {
    const up = vi.fn()

    await payload.db.tryAcquireMigrationLock!({ instanceId: 'other-instance', timeout: 300000 })

    const result = await payload.db.migrate({
      forceAcceptWarning: true,
      migrations: [{ name: 'should-not-run', down: vi.fn(), up }],
      shouldPrompt: false,
    })

    expect(result?.migrated).toEqual([])
    expect(up).not.toHaveBeenCalled()
  })

  test('should propagate an independent connection failure', async ({ payload }) => {
    const independent = await openIndependentAdapter({ payload })

    try {
      await independent.adapter.tryAcquireMigrationLock!({ instanceId: 'owner', timeout: 300000 })
    } finally {
      await independent.close()
    }

    await expect(
      independent.adapter.tryAcquireMigrationLock!({
        instanceId: 'other-owner',
        timeout: 300000,
      }),
    ).rejects.toThrow()
  })

  test.options(
    'should fail when SQL lock storage is missing and permit explicit bootstrap',
    { db: 'drizzle' },
    async ({ payload }) => {
      const adapter = payload.db as any
      const tableName = adapter.tableNameMap.get('payload_migrations_lock') as string
      const quotedName = `"${tableName.replaceAll('"', '""')}"`
      const schemaPrefix = adapter.schemaName
        ? `"${adapter.schemaName.replaceAll('"', '""')}".`
        : ''
      const temporaryName = `"${tableName.replaceAll('"', '""')}_bootstrap_test"`
      const up = vi.fn()
      const args = {
        forceAcceptWarning: true,
        migrations: [{ name: 'bootstrap-lock-storage', down: vi.fn(), up }],
        shouldPrompt: false,
      }

      await adapter.execute({
        drizzle: adapter.drizzle,
        raw: `ALTER TABLE ${schemaPrefix}${quotedName} RENAME TO ${temporaryName}`,
      })

      try {
        await expect(payload.db.migrate(args)).rejects.toThrow()
        expect(up).not.toHaveBeenCalled()

        const result = await payload.db.migrate({ ...args, skipLock: true })

        expect(result?.migrated).toEqual(['bootstrap-lock-storage'])
        expect(up).toHaveBeenCalledTimes(1)
      } finally {
        await adapter.execute({
          drizzle: adapter.drizzle,
          raw: `ALTER TABLE ${schemaPrefix}${temporaryName} RENAME TO ${quotedName}`,
        })
      }
    },
  )

  test.options(
    'should acquire after bounded SQLite writer contention',
    { db: (db) => db.startsWith('sqlite') },
    async ({ payload }) => {
      await payload.db.tryAcquireMigrationLock!({ instanceId: 'initial', timeout: 300000 })
      await payload.db.releaseMigrationLock!({ instanceId: 'initial' })

      const independent = await openIndependentAdapter({ payload })

      connections.push(independent.close)

      const adapter = independent.adapter as any
      const client = adapter.drizzle.$client

      await client.execute('BEGIN IMMEDIATE')

      let isTransactionOpen = true
      const acquisition = payload.db.tryAcquireMigrationLock!({
        instanceId: 'winner',
        timeout: 300000,
      })

      try {
        // Keep a separate connection's writer reservation through the first retry.
        await new Promise((resolve) => setTimeout(resolve, 50))
        await client.execute('COMMIT')
        isTransactionOpen = false

        const result = await acquisition
        expect(result).toEqual({ acquired: true })
      } finally {
        if (isTransactionOpen) {
          await client.execute('ROLLBACK')
        }
      }
    },
  )

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

// Open another physical connection without initializing or resetting the fixture database.
async function openIndependentAdapter({ payload }: { payload: Payload }): Promise<{
  adapter: BaseDatabaseAdapter
  close: () => Promise<void>
}> {
  const original = payload.db as any

  if (original.name === 'mongoose') {
    const require = createRequire(import.meta.resolve('@payloadcms/db-mongodb'))
    const mongoose = require('mongoose')
    const connection = await mongoose
      .createConnection(original.url, original.connectOptions)
      .asPromise()

    return {
      adapter: { ...original, globals: { collection: connection.collection('globals') } },
      close: () => connection.close(),
    }
  }

  const schema = { ...original.tables, ...original.relations }

  if (original.name === 'sqlite') {
    const require = createRequire(import.meta.resolve('@payloadcms/db-sqlite'))
    const { createClient } = require('@libsql/client')
    const { drizzle } = require('drizzle-orm/libsql')
    const client = createClient(original.clientConfig)

    return {
      adapter: { ...original, drizzle: drizzle(client, { schema }), primaryDrizzle: undefined },
      close: () => {
        client.close()
        return Promise.resolve()
      },
    }
  }

  const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
  const { drizzle } = require('drizzle-orm/node-postgres')
  const { Pool } = require('pg')
  const pool = new Pool({ ...original.pool.options, max: 1 })

  return {
    adapter: { ...original, drizzle: drizzle(pool, { schema }), primaryDrizzle: undefined },
    close: () => pool.end(),
  }
}

async function countLockRecords({ payload }: { payload: Payload }): Promise<number> {
  const adapter = payload.db as any

  if (adapter.name === 'mongoose') {
    return adapter.globals.collection.countDocuments({ globalType: 'payload-migrations-lock' })
  }

  const table = adapter.tables[adapter.tableNameMap.get('payload_migrations_lock')]
  const records = await adapter.drizzle.select().from(table)

  return records.length
}
