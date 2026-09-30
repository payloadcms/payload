import { describe, expect, it, vi } from 'vitest'

import { insert as postgresInsert } from './postgres/insert.js'
import { insert as sqliteInsert } from './sqlite/insert.js'

describe('adapter insert conflict handling', () => {
  it('should return no PostgreSQL rows when a targeted insert conflict does nothing', async () => {
    const returning = vi.fn().mockResolvedValue([])
    const onConflictDoNothing = vi.fn(() => ({ returning }))
    const values = vi.fn(() => ({ onConflictDoNothing, returning }))
    const db = { insert: vi.fn(() => ({ values })) }
    const target = { name: '_branch' }

    const result = await postgresInsert.call(
      { tables: { settings: 'settings-table' } } as never,
      {
        db,
        onConflictDoNothing: { target },
        tableName: 'settings',
        values: { _branch: 'feature' },
      } as never,
    )

    expect(onConflictDoNothing).toHaveBeenCalledWith({ target })
    expect(result).toEqual([])
  })

  it('should return no SQLite rows when a targeted insert conflict does nothing', async () => {
    const returning = vi.fn().mockResolvedValue([])
    const onConflictDoNothing = vi.fn(() => ({ returning }))
    const values = vi.fn(() => ({ onConflictDoNothing, returning }))
    const db = { insert: vi.fn(() => ({ values })) }
    const target = { name: '_branch' }

    const result = await sqliteInsert.call(
      { limitedBoundParameters: false, tables: { settings: 'settings-table' } } as never,
      {
        db,
        onConflictDoNothing: { target },
        tableName: 'settings',
        values: { _branch: 'feature' },
      } as never,
    )

    expect(onConflictDoNothing).toHaveBeenCalledWith({ target })
    expect(result).toEqual([])
  })
})
