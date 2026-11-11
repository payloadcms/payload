import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import { insertArrays } from './insertArrays.js'

it('should scope physical ID mappings by table and preserve zero logical IDs', async () => {
  const insert = vi.fn(async ({ tableName, values }) =>
    values.map((value) => ({ ...value, id: tableName === 'first' ? 11 : 22 })),
  )
  const adapter = { insert, tables: { first: {}, second: {} } } as unknown as DrizzleAdapter
  const uuidMap = new Map<string, Map<string, number | string>>()

  await insertArrays({
    adapter,
    arrays: [
      {
        first: [{ arrays: {}, locales: {}, row: { _uuid: 0 } }],
        second: [{ arrays: {}, locales: {}, row: { _uuid: 0 } }],
      },
    ] as never,
    db: {} as never,
    parentRows: [{ id: 1 }],
    uuidMap,
  })

  expect(uuidMap.get('first').get('0')).toBe(11)
  expect(uuidMap.get('second').get('0')).toBe(22)
})

it('should attach nested select values to the correct table for repeated zero custom IDs', async () => {
  const { createClient } = await import('@libsql/client')
  const { drizzle } = await import('drizzle-orm/libsql')
  const { integer, sqliteTable, text } = await import('drizzle-orm/sqlite-core')
  const { sql } = await import('drizzle-orm')
  const { upsertRow } = await import('./index.js')
  const client = createClient({ url: ':memory:' })

  try {
    const db = drizzle(client)
    const documents = sqliteTable('documents', { id: integer('id').primaryKey() })
    const first = sqliteTable('documents_first', {
      id: integer('id').primaryKey(),
      _uuid: integer('_uuid'),
      _parentID: integer('_parent_id'),
      _order: integer('_order'),
    })
    const second = sqliteTable('documents_second', {
      id: integer('id').primaryKey(),
      _uuid: integer('_uuid'),
      _parentID: integer('_parent_id'),
      _order: integer('_order'),
    })
    const firstOptions = sqliteTable('documents_first_options', {
      id: integer('id').primaryKey(),
      parent: integer('parent_id'),
      order: integer('order'),
      value: text('value'),
    })
    const secondOptions = sqliteTable('documents_second_options', {
      id: integer('id').primaryKey(),
      parent: integer('parent_id'),
      order: integer('order'),
      value: text('value'),
    })
    const tables = {
      documents,
      documents_first: first,
      documents_second: second,
      documents_first_options: firstOptions,
      documents_second_options: secondOptions,
    }

    await db.run(sql.raw('CREATE TABLE documents (id INTEGER PRIMARY KEY)'))
    for (const name of ['documents_first', 'documents_second'])
      await db.run(
        sql.raw(
          `CREATE TABLE ${name} (id INTEGER PRIMARY KEY, _uuid INTEGER, _parent_id INTEGER, _order INTEGER)`,
        ),
      )
    for (const name of ['documents_first_options', 'documents_second_options'])
      await db.run(
        sql.raw(
          `CREATE TABLE ${name} (id INTEGER PRIMARY KEY, parent_id INTEGER, "order" INTEGER, value TEXT)`,
        ),
      )
    await db.run(sql.raw('INSERT INTO documents_second (id, _uuid) VALUES (100, 99)'))
    const adapter = {
      payload: { config: {} },
      tables,
      tableNameMap: new Map(Object.keys(tables).map((name) => [name, name])),
      rawRelations: {
        documents_first_options: { parent: { to: 'documents_first' } },
        documents_second_options: { parent: { to: 'documents_second' } },
      },
      insert: async ({ tableName, values }) =>
        db.insert(tables[tableName]).values(values).returning(),
    } as unknown as DrizzleAdapter
    const fields = ['first', 'second'].map((name) => ({
      name,
      type: 'array',
      flattenedFields: [
        { name: 'id', type: 'number' },
        { name: 'options', type: 'select', hasMany: true, options: ['one', 'two'] },
      ],
    }))

    await upsertRow({
      adapter,
      db: db as never,
      data: { first: [{ id: 0, options: ['one'] }], second: [{ id: 0, options: ['two'] }] },
      fields: fields as never,
      tableName: 'documents',
      operation: 'create',
      ignoreResult: true,
    })
    expect(await db.all(sql.raw('SELECT parent_id, value FROM documents_first_options'))).toEqual([
      { parent_id: 1, value: 'one' },
    ])
    expect(await db.all(sql.raw('SELECT parent_id, value FROM documents_second_options'))).toEqual([
      { parent_id: 101, value: 'two' },
    ])
    await expect(
      upsertRow({
        adapter,
        db: db as never,
        data: { first: [{ id: 0 }, { id: 0 }] },
        fields: fields as never,
        tableName: 'documents',
        operation: 'create',
        ignoreResult: true,
      }),
    ).rejects.toThrow('Duplicate public row ID')
    await expect(
      upsertRow({
        adapter,
        db: db as never,
        data: { first: [{}] },
        fields: fields as never,
        tableName: 'documents',
        operation: 'create',
        ignoreResult: true,
      }),
    ).rejects.toThrow('require a public ID')
    expect(await db.all(sql.raw('SELECT count(*) AS count FROM documents'))).toEqual([{ count: 1 }])
  } finally {
    client.close()
  }
})
