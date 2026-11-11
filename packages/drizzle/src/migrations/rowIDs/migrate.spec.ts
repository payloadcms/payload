import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { afterEach, describe, expect, it } from 'vitest'

import { assertRowIDsCanBePushed } from './assertCanPush.js'
import { buildRowIDMigration } from './buildMigration.js'
import { migrateSQLRowIDs } from './migrate.js'

const clients: ReturnType<typeof createClient>[] = []

afterEach(() => {
  for (const client of clients.splice(0)) {
    client.close()
  }
})

describe('uniform SQLite row ID migration', () => {
  it.each(['number', 'uuid', 'uuidv7'] as const)(
    'should convert an empty legacy database with %s keys',
    async (idType) => {
      const { db, plan } = await setup({ idType })

      await migrateSQLRowIDs({ db, plan })
      expect(await db.all(sql.raw('SELECT _uuid FROM rows'))).toEqual([])
      expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])
    },
  )

  it.each(['number', 'uuid', 'uuidv7'] as const)(
    'should preserve ownership and public IDs with %s storage keys',
    async (idType) => {
      const { after, before, db, plan } = await setup({ idType })

      await db.run(sql.raw(`INSERT INTO rows (id,label) VALUES ('object-id', 'Parent');`))
      await db.run(
        sql.raw(
          `INSERT INTO children (id,_parent_id,label) VALUES ('custom-child', 'object-id', 'Child');`,
        ),
      )
      await db.run(sql.raw(`INSERT INTO localized VALUES (27, 'object-id', 'fr', 'Traduit');`))
      await migrateSQLRowIDs({ db, plan })

      expect(
        await db.all(
          sql.raw(
            'SELECT child._uuid, child.label, parent._uuid AS parent FROM children child JOIN rows parent ON child._parent_id = parent.id',
          ),
        ),
      ).toEqual([{ _uuid: 'custom-child', label: 'Child', parent: 'object-id' }])
      expect(
        await db.all(
          sql.raw(
            'SELECT child.label FROM localized child JOIN rows parent ON child._parent_id = parent.id',
          ),
        ),
      ).toEqual([{ label: 'Traduit' }])
      expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])
      expect(await db.all(sql.raw('PRAGMA foreign_keys'))).toEqual([{ foreign_keys: 1 }])
      if (idType === 'uuidv7') {
        const [row] = await db.all<{ id: string }>(sql.raw('SELECT id FROM rows'))
        expect(row.id[14]).toBe('7')
      }
      const originalKeys = await db.all(sql.raw('SELECT id, _uuid FROM rows'))
      await migrateSQLRowIDs({ db, plan })
      expect(await db.all(sql.raw('SELECT id, _uuid FROM rows'))).toEqual(originalKeys)

      const down = await buildRowIDMigration({
        adapter: { idType } as never,
        before: after,
        after: before,
        generateMigration: generateSQLiteMigration as never,
      })

      await migrateSQLRowIDs({ db, plan: down.plan })
      expect(await db.all(sql.raw('SELECT id FROM rows'))).toEqual([{ id: 'object-id' }])
      expect(await db.all(sql.raw('SELECT id, _parent_id FROM children'))).toEqual([
        { id: 'custom-child', _parent_id: 'object-id' },
      ])
      expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])
    },
  )

  it('should preserve a zero numeric custom public ID', async () => {
    const { db, plan } = await setup({ idType: 'number', hasNumericID: true })

    await db.run(sql.raw(`INSERT INTO rows (id, label) VALUES (0, 'Zero')`))
    await migrateSQLRowIDs({ db, plan })
    expect(await db.all(sql.raw('SELECT _uuid, label FROM rows'))).toEqual([
      { _uuid: 0, label: 'Zero' },
    ])
  })

  it('should atomically reject rollback with duplicate public IDs', async () => {
    const { after, before, db, plan } = await setup({ idType: 'number' })

    await migrateSQLRowIDs({ db, plan })
    await db.run(sql.raw(`INSERT INTO rows (_uuid,label) VALUES ('same','Main'),('same','Copy')`))
    const down = await buildRowIDMigration({
      adapter: { idType: 'number' } as never,
      before: after,
      after: before,
      generateMigration: generateSQLiteMigration as never,
    })

    await expect(migrateSQLRowIDs({ db, plan: down.plan })).rejects.toThrow()
    expect(await db.all(sql.raw('SELECT _uuid FROM rows'))).toEqual([
      { _uuid: 'same' },
      { _uuid: 'same' },
    ])
    expect(
      await db.all(sql.raw(`SELECT name FROM sqlite_master WHERE name LIKE '__payload_%'`)),
    ).toEqual([])
    expect(await db.all(sql.raw('PRAGMA foreign_keys'))).toEqual([{ foreign_keys: 1 }])
  })

  it('should refuse to discard a custom trigger', async () => {
    const { db, plan } = await setup({ idType: 'number' })

    await db.run(sql.raw(`CREATE TRIGGER custom_trigger AFTER INSERT ON rows BEGIN SELECT 1; END`))
    await expect(migrateSQLRowIDs({ db, plan })).rejects.toThrow('custom triggers')
    expect(await db.all(sql.raw(`SELECT name FROM sqlite_master WHERE type = 'trigger'`))).toEqual([
      { name: 'custom_trigger' },
    ])
  })

  it('should require a migration for legacy databases and allow an already migrated schema', async () => {
    const { db, plan } = await setup({ idType: 'number' })
    const adapter = {
      name: 'sqlite',
      drizzle: db,
      rawTables: {
        rows: {
          name: 'rows',
          columns: { id: { primaryKey: true }, _uuid: {}, _order: {}, _parentID: {} },
        },
      },
    }

    await expect(assertRowIDsCanBePushed({ adapter: adapter as never })).rejects.toThrow(
      'push: false',
    )
    await migrateSQLRowIDs({ db, plan })
    await expect(assertRowIDsCanBePushed({ adapter: adapter as never })).resolves.toBeUndefined()
  })

  it('should keep unrelated config changes in the normal schema migration', async () => {
    const { after, before } = await setup({ idType: 'number' })

    const migration = await buildRowIDMigration({
      adapter: { idType: 'number' } as never,
      before,
      after,
      generateMigration: generateSQLiteMigration as never,
    })
    expect(await generateSQLiteMigration(migration.snapshot as never, after)).toEqual([])
    expect(
      (
        await buildRowIDMigration({
          adapter: { idType: 'number' } as never,
          before: after,
          after,
          generateMigration: generateSQLiteMigration as never,
        })
      ).plan,
    ).toBeUndefined()
  })
})

async function setup({
  idType,
  hasNumericID = false,
}: {
  idType: 'number' | 'uuid' | 'uuidv7'
  hasNumericID?: boolean
}) {
  const client = createClient({ url: ':memory:' })

  clients.push(client)
  const db = drizzle(client)
  const makeSchema = ({ isLegacy }: { isLegacy: boolean }) => {
    const rows = sqliteTable('rows', {
      _order: integer('_order').notNull().default(1),
      _parent_id: integer('_parent_id').notNull().default(1),
      id: isLegacy
        ? hasNumericID
          ? numeric('id').primaryKey()
          : text('id').primaryKey()
        : idType !== 'number'
          ? text('id').primaryKey()
          : integer('id').primaryKey(),
      label: text('label'),
      ...(!isLegacy ? { _uuid: hasNumericID ? numeric('_uuid') : text('_uuid') } : {}),
    })
    const children = sqliteTable('children', {
      _order: integer('_order').notNull().default(1),
      id: isLegacy || idType !== 'number' ? text('id').primaryKey() : integer('id').primaryKey(),
      _parent_id: (isLegacy || idType !== 'number' ? text('_parent_id') : integer('_parent_id'))
        .notNull()
        .references(() => rows.id, { onDelete: 'cascade' }),
      label: text('label'),
      ...(!isLegacy ? { _uuid: text('_uuid') } : {}),
    })
    const localized = sqliteTable('localized', {
      id: integer('id').primaryKey(),
      _parent_id: (isLegacy || idType !== 'number' ? text('_parent_id') : integer('_parent_id'))
        .notNull()
        .references(() => rows.id, { onDelete: 'cascade' }),
      locale: text('locale'),
      label: text('label'),
    })
    return { rows, children, localized }
  }
  const before = await generateSQLiteDrizzleJson(makeSchema({ isLegacy: true }))
  const after = await generateSQLiteDrizzleJson(makeSchema({ isLegacy: false }), before.id)
  const empty = await generateSQLiteDrizzleJson({})

  for (const statement of await generateSQLiteMigration(empty, before)) {
    await db.run(sql.raw(statement))
  }
  const { plan } = await buildRowIDMigration({
    adapter: { idType } as never,
    before,
    after,
    generateMigration: generateSQLiteMigration as never,
  })

  return { after, before, client, db, plan }
}
