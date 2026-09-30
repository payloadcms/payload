import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'
import { branchChangesCollectionSlug } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { vercelPostgresAdapter } from './index.js'

describe('vercelPostgresAdapter', () => {
  it('should expose the branch-global adapter helpers', () => {
    const factory = vercelPostgresAdapter()
    const adapter = factory.init({ payload: {} as Payload })

    expect(adapter.deleteBranchGlobal).toBeTypeOf('function')
    expect(adapter.upsertBranchGlobalChange).toBeTypeOf('function')
  })

  it('should delete the requested branch global row', async () => {
    const factory = vercelPostgresAdapter()
    const adapter = factory.init({ payload: {} as Payload })
    const deleteWhere = vi.fn().mockResolvedValue(undefined)

    adapter.deleteWhere = deleteWhere
    adapter.tableNameMap.set('settings', 'settings')
    adapter.tables.settings = { _branch: sql`_branch` } as never

    await adapter.deleteBranchGlobal?.({ branch: 'feature', globalSlug: 'settings' })

    expect(deleteWhere).toHaveBeenCalledWith({
      db: adapter.drizzle,
      tableName: 'settings',
      where: expect.anything(),
    })
    expect(adapter.lastWriteTimestamp).toBeTypeOf('number')
  })

  it('should atomically register the requested branch global change', async () => {
    const factory = vercelPostgresAdapter()
    const adapter = factory.init({ payload: {} as Payload })
    const insert = vi.fn().mockResolvedValue([])
    const branchColumn = sql`branch`
    const globalSlugColumn = sql`global_slug`
    const tableName = 'payload_branch_changes'

    adapter.insert = insert
    adapter.tableNameMap.set(branchChangesCollectionSlug.replaceAll('-', '_'), tableName)
    adapter.tables[tableName] = { branch: branchColumn, globalSlug: globalSlugColumn } as never

    await adapter.upsertBranchGlobalChange?.({ branch: 'feature', globalSlug: 'settings' })

    expect(insert).toHaveBeenCalledWith({
      db: adapter.drizzle,
      onConflictDoUpdate: {
        set: { globalSlug: 'settings' },
        target: [branchColumn, globalSlugColumn],
      },
      tableName,
      values: expect.objectContaining({
        branch: 'feature',
        entityType: 'global',
        globalSlug: 'settings',
        operation: 'update',
      }),
    })
    expect(adapter.lastWriteTimestamp).toBeTypeOf('number')
  })
})
