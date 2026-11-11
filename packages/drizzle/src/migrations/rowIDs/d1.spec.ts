import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

import { buildRowIDMigration } from './buildMigration.js'
import { migrateSQLRowIDs } from './migrate.js'

describe.skipIf(!process.env.PAYLOAD_ROW_ID_D1)('D1 row ID migrations', () => {
  it.each(['number', 'uuid', 'uuidv7'] as const)(
    'should preserve children and roll back unsafe conversion for %s keys',
    async (idType) => {
      const require = createRequire(`${process.cwd()}/package.json`)
      const { Miniflare } = createRequire(require.resolve('wrangler/package.json'))('miniflare')
      const worker = new Miniflare({
        modules: true,
        script: 'export default {fetch() { return new Response("OK") }}',
        compatibilityDate: '2026-01-28',
        d1Databases: ['DB'],
      })

      try {
        const db = drizzle(await worker.getD1Database('DB'))
        const makeSchema = ({ isLegacy }: { isLegacy: boolean }) => {
          const rows = sqliteTable('rows', {
            id:
              isLegacy || idType !== 'number'
                ? text('id').primaryKey()
                : integer('id').primaryKey(),
            _order: integer('_order').default(1),
            _parent_id: integer('_parent_id').default(1),
            ...(!isLegacy ? { _uuid: text('_uuid') } : {}),
          })
          const children = sqliteTable('children', {
            id: integer('id').primaryKey(),
            _parent_id: (isLegacy || idType !== 'number'
              ? text('_parent_id')
              : integer('_parent_id')
            )
              .notNull()
              .references(() => rows.id, { onDelete: 'cascade' }),
            label: text('label'),
          })
          return { rows, children }
        }
        const before = await generateSQLiteDrizzleJson(makeSchema({ isLegacy: true }))
        const after = await generateSQLiteDrizzleJson(makeSchema({ isLegacy: false }))
        const empty = await generateSQLiteDrizzleJson({})

        for (const statement of await generateSQLiteMigration(empty, before))
          await db.run(sql.raw(statement))
        await db.run(sql.raw(`INSERT INTO rows (id) VALUES ('public-id')`))
        await db.run(sql.raw(`INSERT INTO children VALUES (7,'public-id','Child')`))
        const up = await buildRowIDMigration({
          adapter: { idType } as never,
          before,
          after,
          generateMigration: generateSQLiteMigration as never,
        })

        await migrateSQLRowIDs({ db, plan: up.plan })
        expect(
          await db.all(
            sql.raw(
              'SELECT child.label, parent._uuid FROM children child JOIN rows parent ON child._parent_id=parent.id',
            ),
          ),
        ).toEqual([{ label: 'Child', _uuid: 'public-id' }])
        expect(await db.all(sql.raw('PRAGMA foreign_key_check'))).toEqual([])
        await db.run(
          sql.raw(
            idType === 'number'
              ? `INSERT INTO rows (_uuid) VALUES ('public-id')`
              : `INSERT INTO rows (id,_uuid) VALUES ('new-physical-id','public-id')`,
          ),
        )
        const down = await buildRowIDMigration({
          adapter: { idType } as never,
          before: after,
          after: before,
          generateMigration: generateSQLiteMigration as never,
        })

        await expect(migrateSQLRowIDs({ db, plan: down.plan })).rejects.toThrow()
        expect(await db.all(sql.raw('SELECT count(*) AS count FROM rows'))).toEqual([{ count: 2 }])
        expect(
          await db.all(sql.raw(`SELECT name FROM sqlite_master WHERE name LIKE '__payload_%'`)),
        ).toEqual([])
      } finally {
        await worker.dispose()
      }
    },
    30000,
  )
})
