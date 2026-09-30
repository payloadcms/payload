import type { FlattenedField } from 'payload'

import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { RowToInsert } from '../transform/write/types.js'

const mocks = vi.hoisted(() => ({
  deleteExistingArrayRows: vi.fn(),
  insertArrays: vi.fn(),
  transformForWrite: vi.fn(),
}))

vi.mock('../transform/write/index.js', () => ({ transformForWrite: mocks.transformForWrite }))
vi.mock('./deleteExistingArrayRows.js', () => ({
  deleteExistingArrayRows: mocks.deleteExistingArrayRows,
}))
vi.mock('./insertArrays.js', () => ({ insertArrays: mocks.insertArrays }))

import { upsertRow } from './index.js'

const createTransformedWrite = ({
  arrays = {},
  row,
}: {
  arrays?: RowToInsert['arrays']
  row: RowToInsert['row']
}): RowToInsert => ({
  arrays,
  arraysToPush: {},
  blocks: {},
  blocksToDelete: new Set(),
  locales: {},
  numbers: [],
  numbersToDelete: [],
  relationships: [],
  relationshipsToAppend: [],
  relationshipsToDelete: [],
  row,
  selects: {},
  texts: [],
  textsToDelete: [],
})

describe('upsertRow concurrent inserts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should apply only submitted child rows after another write inserts the parent', async () => {
    const clonedArrayRow = {
      arrays: {},
      arraysToPush: {},
      locales: {},
      row: { label: 'cloned from main' },
    }
    const submittedArrayRow = {
      arrays: {},
      arraysToPush: {},
      locales: {},
      row: { label: 'submitted on branch' },
    }
    const fullInsert = createTransformedWrite({
      arrays: { settings_items: [clonedArrayRow] },
      row: { _branch: 'feature', title: 'main title' },
    })
    const conflictUpdate = createTransformedWrite({
      arrays: { settings_items: [submittedArrayRow] },
      row: { _branch: 'feature', title: 'submitted title' },
    })
    const returning = vi.fn().mockResolvedValue([{ id: 2 }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const update = vi.fn(() => ({ set }))
    const insert = vi.fn().mockResolvedValue([])
    const branchColumn = sql`branch`
    const adapter = {
      deleteWhere: vi.fn(),
      insert,
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {},
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: {
        settings: { _branch: branchColumn, id: sql`id` },
        settings_items: { _parentID: sql`parent_id` },
      },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter

    mocks.transformForWrite.mockReturnValueOnce(fullInsert).mockReturnValueOnce(conflictUpdate)

    await upsertRow({
      adapter,
      data: { _branch: 'feature', items: [{ label: 'cloned from main' }] },
      db: { update } as unknown as DrizzleAdapter['drizzle'],
      fields: [] as FlattenedField[],
      ignoreResult: true,
      operation: 'update',
      tableName: 'settings',
      upsertConflictData: { _branch: 'feature', title: 'submitted title' },
      upsertTarget: branchColumn as never,
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ onConflictDoNothing: { target: branchColumn } }),
    )
    expect(set).toHaveBeenCalledWith(conflictUpdate.row)
    expect(mocks.deleteExistingArrayRows).toHaveBeenCalledWith(
      expect.objectContaining({ parentID: 2, tableName: 'settings_items' }),
    )
    expect(mocks.insertArrays).toHaveBeenCalledWith(
      expect.objectContaining({ arrays: [conflictUpdate.arrays, conflictUpdate.arraysToPush] }),
    )
  })
})
