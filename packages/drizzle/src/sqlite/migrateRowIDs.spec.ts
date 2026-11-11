import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { afterEach, describe, expect, it } from 'vitest'

import { createRequireDrizzleKit } from './createRequireDrizzleKit.js'
import { migrateRowIDs } from './migrateRowIDs.js'

const directories: string[] = []
const clients: ReturnType<typeof createClient>[] = []

afterEach(() => {
  for (const client of clients.splice(0)) {
    client.close()
  }
  for (const directory of directories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe('SQLite branching row ID migrations', () => {
  it.each([false, true])(
    'should preserve row identities and ownership with populated=%s',
    async (hasData) => {
      const { after, before, db, down, up } = await prepareMigration()

      if (hasData) {
        await db.run(sql.raw(`INSERT INTO rows (id, label) VALUES ('public-row-id', 'Parent')`))
        await db.run(
          sql.raw(`INSERT INTO children VALUES ('public-child-id', 'public-row-id', 'Child')`),
        )
        await db.run(
          sql.raw(`INSERT INTO rows_locales VALUES (1, 'public-row-id', 'fr', 'Traduit')`),
        )
      }

      await execute({ db, statements: up })
      expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])

      if (hasData) {
        expect(await db.all(sql.raw('SELECT _uuid, label FROM rows'))).toEqual([
          { _uuid: 'public-row-id', label: 'Parent' },
        ])
        expect(
          await db.all(
            sql.raw(
              'SELECT children._uuid, children.label FROM children JOIN rows ON children._parent_id = rows.id',
            ),
          ),
        ).toEqual([{ _uuid: 'public-child-id', label: 'Child' }])
        expect(
          await db.all(
            sql.raw(
              'SELECT rows_locales.label FROM rows_locales JOIN rows ON rows_locales._parent_id = rows.id',
            ),
          ),
        ).toEqual([{ label: 'Traduit' }])
        // Separate physical rows can retain the same public ID on different branches.
        await db.run(
          sql.raw(`INSERT INTO rows (_uuid, label) VALUES ('public-row-id', 'Branch copy')`),
        )
        await db.run(sql.raw(`DELETE FROM rows WHERE label = 'Branch copy'`))
      }

      await execute({ db, statements: down })
      expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])
      expect(await db.all(sql.raw('SELECT id FROM rows'))).toEqual(
        hasData ? [{ id: 'public-row-id' }] : [],
      )
      expect(await db.all(sql.raw('SELECT id, _parent_id FROM children'))).toEqual(
        hasData ? [{ id: 'public-child-id', _parent_id: 'public-row-id' }] : [],
      )
      expect(migrateRowIDs({ after, before: after, statements: [] })).toEqual([])
      expect(Object.keys(before.tables)).toHaveLength(7)
    },
  )

  it('should preserve block paths and nested array ownership', async () => {
    const { db, down, up } = await prepareMigration()

    await db.run(
      sql.raw(
        `INSERT INTO blocks (id, _parent_id, _path, label) VALUES ('block-id', 1, 'layout.0.blocks', 'Block')`,
      ),
    )
    await db.run(
      sql.raw(
        `INSERT INTO block_children (id, _parent_id, label) VALUES ('item-id', 'block-id', 'Nested item')`,
      ),
    )
    await execute({ db, statements: up })
    expect(
      await db.all(
        sql.raw(
          'SELECT blocks._uuid, blocks._path, block_children._uuid AS item, block_children.label FROM blocks JOIN block_children ON block_children._parent_id = blocks.id',
        ),
      ),
    ).toEqual([
      { _uuid: 'block-id', _path: 'layout.0.blocks', item: 'item-id', label: 'Nested item' },
    ])
    expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])

    await execute({ db, statements: down })
    expect(await db.all(sql.raw('SELECT id, _parent_id FROM block_children'))).toEqual([
      { id: 'item-id', _parent_id: 'block-id' },
    ])
  })

  it('should leave existing version row identities unchanged', async () => {
    const { db, down, up } = await prepareMigration()

    await db.run(sql.raw(`INSERT INTO versions VALUES (23, 'version-row-id')`))
    await execute({ db, statements: up })
    expect(await db.all(sql.raw('SELECT * FROM versions'))).toEqual([
      { id: 23, _uuid: 'version-row-id' },
    ])
    await execute({ db, statements: down })
    expect(await db.all(sql.raw('SELECT * FROM versions'))).toEqual([
      { id: 23, _uuid: 'version-row-id' },
    ])
  })

  it('should refuse a migration inside a transaction before changing content', async () => {
    const { db, up } = await prepareMigration()

    await db.run(sql.raw(`INSERT INTO rows (id, label) VALUES ('public-row-id', 'Parent')`))
    await expect(
      db.transaction(async (transaction) => {
        for (const statement of up) {
          await transaction.run(sql.raw(statement))
        }
      }),
    ).rejects.toThrow('INSERT INTO "__payload_row_id_guard"')
    expect(await db.all(sql.raw('SELECT id FROM rows'))).toEqual([{ id: 'public-row-id' }])
  })

  it('should refuse rollback with duplicate public IDs before rebuilding tables', async () => {
    const { db, down, up } = await prepareMigration()

    await execute({ db, statements: up })
    await db.run(
      sql.raw(`INSERT INTO rows (_uuid, label) VALUES ('same', 'Main'), ('same', 'Branch')`),
    )
    await expect(execute({ db, statements: down })).rejects.toThrow(
      'INSERT INTO "__payload_row_ids_',
    )
    expect(await db.all(sql.raw('SELECT _uuid FROM rows'))).toEqual([
      { _uuid: 'same' },
      { _uuid: 'same' },
    ])
  })

  it('should refuse rollback with missing public IDs before rebuilding tables', async () => {
    const { db, down, up } = await prepareMigration()

    await execute({ db, statements: up })
    await db.run(sql.raw(`INSERT INTO rows (label) VALUES ('Missing public ID')`))
    await expect(execute({ db, statements: down })).rejects.toThrow(
      'INSERT INTO "__payload_row_ids_',
    )
    expect(await db.all(sql.raw('SELECT _uuid FROM rows'))).toEqual([{ _uuid: null }])
  })

  it('should reject dev push with actionable instructions before mutating an old schema', async () => {
    const { db, schema } = await prepareMigration()
    const kit = await createRequireDrizzleKit({
      from: import.meta.url,
      migrateBranchingRowIDs: true,
    })()

    await expect(kit.pushSchema(schema, db as never)).rejects.toThrow('push: false')
    const columns = await db.all<{ name: string }>(sql.raw('PRAGMA table_info(rows)'))

    expect(columns.map(({ name }) => name)).toEqual(['id', 'label'])
  })

  it('should generate the safe conversion through the adapter tooling', async () => {
    const { after, before, db } = await prepareMigration()
    const kit = await createRequireDrizzleKit({
      from: import.meta.url,
      migrateBranchingRowIDs: true,
    })()

    await db.run(sql.raw(`INSERT INTO rows (id, label) VALUES ('public-row-id', 'Parent')`))
    const statements = await kit.generateMigration(before as never, after as never)

    await execute({ db, statements })
    expect(await db.all(sql.raw('SELECT _uuid FROM rows'))).toEqual([{ _uuid: 'public-row-id' }])
  })

  it('should refuse dev push when disabling branching would lose public IDs', async () => {
    const { db, up } = await prepareMigration()
    const kit = await createRequireDrizzleKit({
      from: import.meta.url,
      migrateBranchingRowIDs: true,
    })()

    await execute({ db, statements: up })
    await expect(kit.pushSchema(buildSchema({ isBranching: false }), db as never)).rejects.toThrow(
      'push: false',
    )
  })

  it('should allow dev push for a fresh database', async () => {
    const client = createClient({ url: ':memory:' })

    clients.push(client)
    const kit = await createRequireDrizzleKit({
      from: import.meta.url,
      migrateBranchingRowIDs: true,
    })()
    const result = await kit.pushSchema(
      buildSchema({ isBranching: true }),
      drizzle(client) as never,
    )

    await result.apply()
    expect((await client.execute('PRAGMA table_info(rows)')).rows.map((row) => row.name)).toContain(
      '_uuid',
    )
  })

  it('should fail generation if a dependent table is not rebuilt', async () => {
    const { after, before } = await prepareMigration()

    expect(() => migrateRowIDs({ after, before, statements: [] })).toThrow(
      'requires rebuilding table',
    )
  })
})

async function prepareMigration() {
  const directory = mkdtempSync(path.join(tmpdir(), 'payload-row-ids-'))

  directories.push(directory)
  const client = createClient({ url: `file:${path.join(directory, 'payload.db')}` })

  clients.push(client)
  const db = drizzle(client)
  const before = await generateSQLiteDrizzleJson(buildSchema({ isBranching: false }))
  const schema = buildSchema({ isBranching: true })
  const after = await generateSQLiteDrizzleJson(schema, before.id)
  const empty = await generateSQLiteDrizzleJson({})

  await execute({ db, statements: await generateSQLiteMigration(empty, before) })
  await db.run(sql.raw('INSERT INTO documents (id) VALUES (1)'))
  const up = migrateRowIDs({
    after,
    before,
    statements: await generateSQLiteMigration(before, after),
  })
  const down = migrateRowIDs({
    after: before,
    before: after,
    statements: await generateSQLiteMigration(after, before),
  })

  return { after, before, db, down, schema, up }
}

function buildSchema({ isBranching }: { isBranching: boolean }) {
  const documents = sqliteTable('documents', {
    id: integer('id').primaryKey(),
    ...(isBranching ? { _branch: text('_branch').notNull().default('main') } : {}),
  })
  const rows = sqliteTable('rows', {
    id: isBranching ? integer('id').primaryKey() : text('id').primaryKey(),
    label: text('label'),
    ...(isBranching ? { _uuid: text('_uuid') } : {}),
  })
  const children = sqliteTable('children', {
    id: isBranching ? integer('id').primaryKey() : text('id').primaryKey(),
    _parent_id: (isBranching ? integer('_parent_id') : text('_parent_id'))
      .notNull()
      .references(() => rows.id, { onDelete: 'cascade' }),
    label: text('label'),
    ...(isBranching ? { _uuid: text('_uuid') } : {}),
  })
  const locales = sqliteTable('rows_locales', {
    id: integer('id').primaryKey(),
    _parent_id: (isBranching ? integer('_parent_id') : text('_parent_id'))
      .notNull()
      .references(() => rows.id, { onDelete: 'cascade' }),
    _locale: text('_locale').notNull(),
    label: text('label'),
  })

  const blocks = sqliteTable('blocks', {
    id: isBranching ? integer('id').primaryKey() : text('id').primaryKey(),
    _parent_id: integer('_parent_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    _path: text('_path').notNull(),
    label: text('label'),
    ...(isBranching ? { _uuid: text('_uuid') } : {}),
  })
  const blockChildren = sqliteTable('block_children', {
    id: isBranching ? integer('id').primaryKey() : text('id').primaryKey(),
    _parent_id: (isBranching ? integer('_parent_id') : text('_parent_id'))
      .notNull()
      .references(() => blocks.id, { onDelete: 'cascade' }),
    label: text('label'),
    ...(isBranching ? { _uuid: text('_uuid') } : {}),
  })
  const versions = sqliteTable('versions', { id: integer('id').primaryKey(), _uuid: text('_uuid') })

  return { blockChildren, blocks, children, documents, locales, rows, versions }
}

async function execute({
  db,
  statements,
}: {
  db: ReturnType<typeof drizzle>
  statements: string[]
}) {
  for (const statement of statements) {
    await db.run(sql.raw(statement))
  }
}
