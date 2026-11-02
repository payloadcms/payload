import type { FlattenedField } from 'payload'

import { sql } from 'drizzle-orm'
import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { upsertRow } from './index.js'

describe('upsertRow', () => {
  it('should update matching scalar fields with one conditional write', async () => {
    const where = sql`hash = ${'existing-hash'} and salt = ${'existing-salt'}`
    const executeUpdate = vi.fn().mockResolvedValue(undefined)
    const setData = vi.fn(() => ({ where: executeUpdate }))
    const update = vi.fn(() => ({ set: setData }))
    const insert = vi.fn()
    const adapter = {
      insert,
      payload: { config: {} },
      readReplicasAfterWriteInterval: 2000,
      tables: { users: { id: sql`id` } },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter
    const fields = [
      { name: 'hash', type: 'text' },
      { name: 'salt', type: 'text' },
    ] as FlattenedField[]

    await upsertRow({
      adapter,
      collectionSlug: 'users',
      data: {
        hash: 'updated-hash',
        salt: 'updated-salt',
      },
      db: { update } as unknown as DrizzleAdapter['drizzle'],
      fields,
      ignoreResult: true,
      id: 1,
      operation: 'update',
      tableName: 'users',
      where,
    })

    expect(insert).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
    expect(executeUpdate).toHaveBeenCalledTimes(1)
  })
})
