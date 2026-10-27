import type { FlattenedField } from 'payload'

import { createClient } from '@libsql/client'
import { defineRelations, eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { upsertRow } from './index.js'

describe('upsertRow', () => {
  it.each([true, false])(
    'should respect the update guard when there is no data to write (matches: %s)',
    async (isMatching) => {
      const client = createClient({ url: 'file::memory:' })
      const users = sqliteTable('users', { id: integer().primaryKey(), hash: text() })
      const db = drizzle({ client, relations: defineRelations({ users }) })
      const adapter = {
        payload: { config: {} },
        tables: { users },
        tableNameMap: new Map(),
      } as unknown as DrizzleAdapter

      try {
        await db.run(sql`create table users (id integer primary key, hash text)`)
        await db.insert(users).values({ id: 1, hash: 'current' })

        const result = await upsertRow({
          adapter,
          collectionSlug: 'users',
          data: {},
          db,
          fields: [],
          id: 1,
          operation: 'update',
          tableName: 'users',
          where: eq(users.hash, isMatching ? 'current' : 'stale'),
        })

        expect(result).toEqual(isMatching ? { id: 1 } : null)
      } finally {
        client.close()
      }
    },
  )

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
