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

  it('should keep insert-only clone data out of the conflict update', async () => {
    const insert = vi.fn().mockResolvedValue([])
    const returning = vi.fn().mockResolvedValue([{ id: 2 }])
    const whereUpdate = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where: whereUpdate }))
    const update = vi.fn(() => ({ set }))
    const adapter = {
      deleteWhere: vi.fn(),
      insert,
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {},
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: { settings: { _branch: sql`branch`, id: sql`id` } },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter
    const fields = [
      { name: '_branch', type: 'text' },
      { name: 'title', type: 'text' },
      { name: 'subtitle', type: 'text' },
    ] as FlattenedField[]

    await upsertRow({
      adapter,
      data: {
        _branch: 'feature',
        subtitle: 'cloned from main',
        title: 'submitted title',
      },
      db: { update } as unknown as DrizzleAdapter['drizzle'],
      fields,
      ignoreResult: true,
      operation: 'update',
      tableName: 'settings',
      upsertConflictData: {
        _branch: 'feature',
        title: 'submitted title',
      },
      upsertTarget: adapter.tables.settings._branch,
    })

    expect(set).toHaveBeenCalledWith(expect.not.objectContaining({ subtitle: 'cloned from main' }))
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ title: 'submitted title' }))
  })
})
