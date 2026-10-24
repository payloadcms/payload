import type { Client } from '@libsql/client'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { beginTransaction } from './beginTransaction.js'
import { commitTransaction } from './commitTransaction.js'
import { rollbackTransaction } from './rollbackTransaction.js'

describe('drizzle transactions', () => {
  let client: Client
  let dir: string
  let adapter: DrizzleAdapter

  const countRows = async (table: 'children' | 'parents') => {
    const result = await client.execute(`select count(*) as count from ${table}`)
    return Number(result.rows[0]!.count)
  }

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-drizzle-transactions-'))
    client = createClient({ url: `file:${path.join(dir, 'test.db')}` })

    await client.execute('pragma foreign_keys = on')
    await client.execute('create table parents (id integer primary key)')
    // The foreign key is only checked on COMMIT, so a violation makes the COMMIT fail
    await client.execute(
      'create table children (id integer primary key, parent_id integer references parents (id) deferrable initially deferred)',
    )

    adapter = {
      drizzle: drizzle(client),
      initializing: Promise.resolve(),
      payload: { logger: { error: vi.fn() } },
      sessions: {},
      transactionOptions: {},
    } as unknown as DrizzleAdapter
  })

  afterEach(() => {
    client.close()
    fs.rmSync(dir, { force: true, recursive: true })
  })

  const begin = async () => {
    const id = (await beginTransaction.call(adapter, undefined)) as string
    return { id, tx: adapter.sessions[id]!.db }
  }

  it('should persist the changes of a committed transaction', async () => {
    const { id, tx } = await begin()
    await tx.run(sql`insert into parents (id) values (1)`)
    await tx.run(sql`insert into children (id, parent_id) values (1, 1)`)

    await expect(commitTransaction.call(adapter, id)).resolves.toBeUndefined()

    expect(adapter.sessions[id]).toBeUndefined()
    expect(await countRows('children')).toBe(1)
  })

  it('should discard the changes of a rolled back transaction without throwing', async () => {
    const { id, tx } = await begin()
    await tx.run(sql`insert into parents (id) values (1)`)

    await expect(rollbackTransaction.call(adapter, id)).resolves.toBeUndefined()

    expect(adapter.sessions[id]).toBeUndefined()
    expect(await countRows('parents')).toBe(0)
  })

  it('should reject when the database refuses the COMMIT', async () => {
    const { id, tx } = await begin()
    await tx.run(sql`insert into parents (id) values (1)`)
    // Violates the deferred foreign key, which is only checked on COMMIT
    await tx.run(sql`insert into children (id, parent_id) values (1, 2)`)

    await expect(commitTransaction.call(adapter, id)).rejects.toThrow(/FOREIGN KEY/i)

    expect(adapter.sessions[id]).toBeUndefined()
    expect(await countRows('parents')).toBe(0)
    expect(await countRows('children')).toBe(0)
  })

  it('should still reject beginTransaction when the transaction cannot be started', async () => {
    adapter.drizzle = {
      transaction: () => Promise.reject(new Error('connection refused')),
    } as unknown as DrizzleAdapter['drizzle']

    await expect(beginTransaction.call(adapter, undefined)).rejects.toThrow(
      'Error: cannot begin transaction: connection refused',
    )
    expect(adapter.payload.logger.error).toHaveBeenCalled()
  })
})
