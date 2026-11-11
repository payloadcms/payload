import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { index, integer, pgSchema, serial, uuid, varchar } from 'drizzle-orm/pg-core'
import { generateDrizzleJson, generateMigration, pushSchema } from 'drizzle-kit/api'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { describe, expect, it } from 'vitest'

import { buildRowIDMigration } from './buildMigration.js'
import { migrateSQLRowIDs } from './migrate.js'

// Use only a disposable test database; every case owns and removes its schema.
describe.skipIf(!process.env.PAYLOAD_ROW_ID_POSTGRES_URL)('Postgres row ID migrations', () => {
  it.each(['serial', 'uuid', 'uuidv7'] as const)(
    'should preserve ownership and defaults for %s keys',
    async (idType) => {
      const client = new pg.Client({ connectionString: process.env.PAYLOAD_ROW_ID_POSTGRES_URL })
      const schemaName = `row_ids_${randomUUID().replaceAll('-', '').slice(0, 12)}`

      await client.connect()
      const db = drizzle(client)
      const schema = pgSchema(schemaName)
      const makeSchema = ({ isLegacy }: { isLegacy: boolean }) => {
        const physicalID = () =>
          idType === 'serial'
            ? serial('id').primaryKey()
            : idType === 'uuid'
              ? uuid('id').defaultRandom().primaryKey()
              : uuid('id').primaryKey()
        const rows = schema.table(
          'rows',
          {
            id: isLegacy ? varchar('id').primaryKey() : physicalID(),
            _order: integer('_order').notNull().default(1),
            _parent_id: integer('_parent_id').notNull().default(1),
            label: varchar('label'),
            ...(!isLegacy ? { _uuid: varchar('_uuid') } : {}),
          },
          (table) => [index('rows_label_idx').on(table.label)],
        )
        const children = schema.table('children', {
          id: isLegacy ? varchar('id').primaryKey() : physicalID(),
          _order: integer('_order').notNull().default(1),
          _parent_id: (isLegacy
            ? varchar('_parent_id')
            : idType === 'serial'
              ? integer('_parent_id')
              : uuid('_parent_id')
          )
            .notNull()
            .references(() => rows.id, { onDelete: 'cascade' }),
          ...(!isLegacy ? { _uuid: varchar('_uuid') } : {}),
        })
        const localized = schema.table('localized', {
          id: serial('id').primaryKey(),
          _parent_id: (isLegacy
            ? varchar('_parent_id')
            : idType === 'serial'
              ? integer('_parent_id')
              : uuid('_parent_id')
          )
            .notNull()
            .references(() => rows.id, { onDelete: 'cascade' }),
          label: varchar('label'),
        })
        return { schema, rows, children, localized }
      }
      try {
        await client.query(`CREATE SCHEMA "${schemaName}"`)
        const before = generateDrizzleJson(makeSchema({ isLegacy: true }))
        const targetSchema = makeSchema({ isLegacy: false })
        const after = generateDrizzleJson(targetSchema)
        const empty = { ...before, tables: {} }

        for (const statement of await generateMigration(empty, before))
          await client.query(statement)
        await client.query(
          `INSERT INTO "${schemaName}".rows (id,label) VALUES ('object-id','Parent'); INSERT INTO "${schemaName}".children (id,_parent_id) VALUES ('child-id','object-id'); INSERT INTO "${schemaName}".localized (id,_parent_id,label) VALUES (27,'object-id','Traduit')`,
        )
        const migration = await buildRowIDMigration({
          adapter: { idType } as never,
          before,
          after,
          generateMigration,
        })

        await migrateSQLRowIDs({ db, plan: migration.plan })
        const result = await client.query(
          `SELECT child._uuid, parent._uuid AS parent FROM "${schemaName}".children child JOIN "${schemaName}".rows parent ON child._parent_id=parent.id`,
        )
        expect(result.rows).toEqual([{ _uuid: 'child-id', parent: 'object-id' }])
        const localized = await client.query(
          `INSERT INTO "${schemaName}".localized (_parent_id,label) SELECT id,'New' FROM "${schemaName}".rows RETURNING id`,
        )
        expect(localized.rows[0].id).toBe(28)
        if (idType === 'uuidv7') {
          expect((await client.query(`SELECT id FROM "${schemaName}".rows`)).rows[0].id[14]).toBe(
            '7',
          )
        }
        const drift = await pushSchema(targetSchema, db, [schemaName])
        expect(drift.statementsToExecute).toEqual([])
        const down = await buildRowIDMigration({
          adapter: { idType } as never,
          before: after,
          after: before,
          generateMigration,
        })
        await migrateSQLRowIDs({ db, plan: down.plan })
        expect((await client.query(`SELECT id FROM "${schemaName}".rows`)).rows).toEqual([
          { id: 'object-id' },
        ])
      } finally {
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
        await client.end()
      }
    },
  )
})
