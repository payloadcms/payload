import type { Client } from '@libsql/client'
import type { FlattenedField } from 'payload'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

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
  locales = {},
  row,
  selects = {},
  selectsToDelete = {},
}: {
  arrays?: RowToInsert['arrays']
  locales?: RowToInsert['locales']
  row: RowToInsert['row']
  selects?: RowToInsert['selects']
  selectsToDelete?: RowToInsert['selectsToDelete']
}): RowToInsert => ({
  arrays,
  arraysToPush: {},
  blocks: {},
  blocksToDelete: new Set(),
  locales,
  numbers: [],
  numbersToDelete: [],
  relationships: [],
  relationshipsToAppend: [],
  relationshipsToDelete: [],
  row,
  selects,
  selectsToDelete,
  texts: [],
  textsToDelete: [],
})

const localizedSelectTable = sqliteTable('settings_tags', {
  locale: text('locale'),
  parent: integer('parent_id').notNull(),
  value: text('value').notNull(),
})
const client: Client = createClient({ url: 'file::memory:' })
const queryBuilder = drizzle(client)

afterAll(() => client.close())

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

  it('should preserve omitted localized scalar fields after another write inserts the parent', async () => {
    const fullInsert = createTransformedWrite({
      locales: {
        de: { summary: 'German summary', title: 'German title' },
        en: { summary: 'English summary', title: 'English title' },
      },
      row: { _branch: 'feature' },
    })
    const conflictUpdate = createTransformedWrite({
      locales: {
        de: { title: 'Submitted German title' },
        en: { title: 'Submitted English title' },
      },
      row: { _branch: 'feature' },
    })
    const localizedRows = [
      {
        _locale: 'de',
        _parentID: 2,
        summary: 'Winning German summary',
        title: 'Winning German title',
      },
      {
        _locale: 'en',
        _parentID: 2,
        summary: 'Winning English summary',
        title: 'Winning English title',
      },
    ]
    const returning = vi.fn().mockResolvedValue([{ id: 2 }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const update = vi.fn(() => ({ set }))
    const branchColumn = sql`branch`
    const localeColumn = sql`locale`
    const localeParentColumn = sql`parent_id`
    const adapter = {
      deleteWhere: vi.fn(({ tableName }) => {
        if (tableName === 'settings_locales') {
          localizedRows.length = 0
        }
      }),
      insert: vi.fn(({ onConflictDoUpdate, tableName, values }) => {
        if (tableName === 'settings') {
          return []
        }

        const rows = Array.isArray(values) ? values : [values]

        for (const row of rows) {
          const existingRow = localizedRows.find(
            (localizedRow) =>
              localizedRow._locale === row._locale && localizedRow._parentID === row._parentID,
          )

          if (existingRow && onConflictDoUpdate) {
            Object.assign(existingRow, onConflictDoUpdate.set)
          } else {
            localizedRows.push(row)
          }
        }

        return rows
      }),
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {},
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: {
        settings: { _branch: branchColumn, id: sql`id` },
        settings_locales: {
          _locale: localeColumn,
          _parentID: localeParentColumn,
        },
      },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter

    mocks.transformForWrite.mockReturnValueOnce(fullInsert).mockReturnValueOnce(conflictUpdate)

    await upsertRow({
      adapter,
      data: {
        _branch: 'feature',
        summary: { de: 'German summary', en: 'English summary' },
        title: { de: 'German title', en: 'English title' },
      },
      db: { update } as unknown as DrizzleAdapter['drizzle'],
      fields: [] as FlattenedField[],
      ignoreResult: true,
      operation: 'update',
      tableName: 'settings',
      upsertConflictData: {
        _branch: 'feature',
        title: { de: 'Submitted German title', en: 'Submitted English title' },
      },
      upsertTarget: branchColumn as never,
    })

    expect(localizedRows).toEqual([
      {
        _locale: 'de',
        _parentID: 2,
        summary: 'Winning German summary',
        title: 'Submitted German title',
      },
      {
        _locale: 'en',
        _parentID: 2,
        summary: 'Winning English summary',
        title: 'Submitted English title',
      },
    ])
  })

  it('should replace omitted locale rows during an ordinary update', async () => {
    const transformedWrite = createTransformedWrite({
      locales: {
        en: { title: 'Published English title' },
      },
      row: { title: 'Published title' },
    })
    const localizedRows = [
      {
        _locale: 'en',
        _parentID: 2,
        title: 'Previous English title',
      },
      {
        _locale: 'es',
        _parentID: 2,
        title: 'Spanish draft',
      },
    ]
    const localeColumn = sql`locale`
    const localeParentColumn = sql`parent_id`
    const fields = [
      {
        localized: true,
        name: 'title',
        type: 'text',
      },
    ] as FlattenedField[]
    const adapter = {
      deleteWhere: vi.fn(({ tableName }) => {
        if (tableName === 'settings_locales') {
          localizedRows.length = 0
        }
      }),
      insert: vi.fn(({ onConflictDoUpdate, tableName, values }) => {
        if (tableName === 'settings') {
          return [{ id: 2 }]
        }

        const rows = Array.isArray(values) ? values : [values]

        for (const row of rows) {
          const existingRow = localizedRows.find(
            (localizedRow) =>
              localizedRow._locale === row._locale && localizedRow._parentID === row._parentID,
          )

          if (existingRow && onConflictDoUpdate) {
            Object.assign(existingRow, onConflictDoUpdate.set)
          } else {
            localizedRows.push(row)
          }
        }

        return rows
      }),
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {},
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: {
        settings: { id: sql`id` },
        settings_locales: {
          _locale: localeColumn,
          _parentID: localeParentColumn,
        },
      },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter

    mocks.transformForWrite.mockReturnValueOnce(transformedWrite)

    await upsertRow({
      id: 2,
      adapter,
      data: { title: { en: 'Published English title' } },
      db: {} as DrizzleAdapter['drizzle'],
      fields,
      ignoreResult: true,
      operation: 'update',
      tableName: 'settings',
    })

    expect(localizedRows).toEqual([
      {
        _locale: 'en',
        _parentID: 2,
        title: 'Published English title',
      },
    ])
  })

  it('should preserve omitted select locales after another write inserts the parent', async () => {
    const fullInsert = createTransformedWrite({
      row: { _branch: 'feature' },
      selects: {
        settings_tags: [
          { locale: 'de', value: 'one' },
          { locale: 'en', value: 'one' },
        ],
      },
      selectsToDelete: {
        settings_tags: [{ locale: 'de' }, { locale: 'en' }],
      },
    })
    const conflictUpdate = createTransformedWrite({
      row: { _branch: 'feature' },
      selects: { settings_tags: [] },
      selectsToDelete: { settings_tags: [{ locale: 'en' }] },
    })
    const returning = vi.fn().mockResolvedValue([{ id: 2 }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const update = vi.fn(() => ({ set }))
    const deletionQueries: { params: unknown[]; sql: string }[] = []
    const branchColumn = sql`branch`
    const adapter = {
      deleteWhere: vi.fn(({ tableName, where }) => {
        if (tableName === 'settings_tags') {
          deletionQueries.push(queryBuilder.delete(localizedSelectTable).where(where).toSQL())
        }
      }),
      insert: vi.fn(({ tableName, values }) => (tableName === 'settings' ? [] : values)),
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {},
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: {
        settings: { _branch: branchColumn, id: sql`id` },
        settings_tags: localizedSelectTable,
      },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter

    mocks.transformForWrite.mockReturnValueOnce(fullInsert).mockReturnValueOnce(conflictUpdate)

    await upsertRow({
      adapter,
      data: { _branch: 'feature', tags: { de: ['one'], en: ['one'] } },
      db: { update } as unknown as DrizzleAdapter['drizzle'],
      fields: [] as FlattenedField[],
      ignoreResult: true,
      operation: 'update',
      tableName: 'settings',
      upsertConflictData: { _branch: 'feature', tags: { en: [] } },
      upsertTarget: branchColumn as never,
    })

    expect(deletionQueries).toEqual([
      {
        params: [2, 'en'],
        sql: 'delete from "settings_tags" where ("settings_tags"."parent_id" = ? and "settings_tags"."locale" = ?)',
      },
    ])
  })

  it('should limit unlocalized select replacement to rows with no locale', async () => {
    const fullInsert = createTransformedWrite({
      row: { _branch: 'feature' },
      selects: { settings_tags: [{ value: 'one' }] },
      selectsToDelete: { settings_tags: [{}] },
    })
    const conflictUpdate = createTransformedWrite({
      row: { _branch: 'feature' },
      selects: { settings_tags: [] },
      selectsToDelete: { settings_tags: [{}] },
    })
    const returning = vi.fn().mockResolvedValue([{ id: 2 }])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const update = vi.fn(() => ({ set }))
    const deletionQueries: { params: unknown[]; sql: string }[] = []
    const branchColumn = sql`branch`
    const adapter = {
      deleteWhere: vi.fn(({ tableName, where }) => {
        if (tableName === 'settings_tags') {
          deletionQueries.push(queryBuilder.delete(localizedSelectTable).where(where).toSQL())
        }
      }),
      insert: vi.fn(({ tableName, values }) => (tableName === 'settings' ? [] : values)),
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {},
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: {
        settings: { _branch: branchColumn, id: sql`id` },
        settings_tags: localizedSelectTable,
      },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter

    mocks.transformForWrite.mockReturnValueOnce(fullInsert).mockReturnValueOnce(conflictUpdate)

    await upsertRow({
      adapter,
      data: { _branch: 'feature', tags: ['one'] },
      db: { update } as unknown as DrizzleAdapter['drizzle'],
      fields: [] as FlattenedField[],
      ignoreResult: true,
      operation: 'update',
      tableName: 'settings',
      upsertConflictData: { _branch: 'feature', tags: [] },
      upsertTarget: branchColumn as never,
    })

    expect(deletionQueries).toEqual([
      {
        params: [2],
        sql: 'delete from "settings_tags" where ("settings_tags"."parent_id" = ? and "settings_tags"."locale" is null)',
      },
    ])
  })
})
