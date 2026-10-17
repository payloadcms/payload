import { sql } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'

import { migratePostgresLocalizeStatus } from '../postgres/predefinedMigrations/localize-status/index.js'
import { migrateSqliteLocalizeStatus } from '../sqlite/predefinedMigrations/localize-status/index.js'

const databases: DatabaseSync[] = []

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close()
  }
})

describe.each(['postgres', 'sqlite'])('localize-status main data (%s)', (dialect) => {
  it.each([
    { isGlobal: false, hasMainLocales: false },
    { isGlobal: true, hasMainLocales: false },
    { isGlobal: false, hasMainLocales: true },
    { isGlobal: true, hasMainLocales: true },
  ])(
    'should preserve published status for $isGlobal globals with $hasMainLocales locales',
    async ({ isGlobal, hasMainLocales }) => {
      const database = new DatabaseSync(':memory:')

      databases.push(database)
      database.exec(`
      CREATE TABLE posts (id INTEGER PRIMARY KEY, _status TEXT);
      INSERT INTO posts VALUES (1, 'published');
      CREATE TABLE _posts_v (id INTEGER PRIMARY KEY, parent_id INTEGER, version__status TEXT, published_locale TEXT, snapshot INTEGER, created_at TEXT);
      INSERT INTO _posts_v VALUES (1, 1, 'published', NULL, 0, '2026-01-01');
      CREATE TABLE _posts_v_locales (id INTEGER PRIMARY KEY, _parent_id INTEGER, _locale TEXT);
      INSERT INTO _posts_v_locales VALUES (1, 1, 'en'), (2, 1, 'es');
    `)

      if (hasMainLocales) {
        database.exec(`
        CREATE TABLE posts_locales (id INTEGER PRIMARY KEY, _parent_id INTEGER, _locale TEXT);
        INSERT INTO posts_locales VALUES (1, 1, 'en'), (2, 1, 'es');
      `)
      }

      const entity = { slug: 'posts', versions: { drafts: { localizeStatus: true } } }
      const payload = {
        config: {
          collections: isGlobal ? [] : [entity],
          globals: isGlobal ? [entity] : [],
          localization: { localeCodes: ['en', 'es'] },
        },
        logger: { info: () => {}, warn: () => {} },
      } as any
      const entityArgs = isGlobal ? { globalSlug: 'posts' } : { collectionSlug: 'posts' }

      if (dialect === 'postgres') {
        const pgDialect = new PgDialect()

        await migratePostgresLocalizeStatus({
          ...entityArgs,
          db: {
            // Run portable SQL against SQLite; emulate only PostgreSQL's catalog queries.
            execute: ({ sql: query }) => {
              const compiled = pgDialect.sqlToQuery(query)

              if (compiled.sql.includes('information_schema.columns')) {
                const [, tableName] = compiled.params
                const columnName =
                  compiled.params[2] ?? compiled.sql.match(/column_name\s*=\s*'([^']+)'/)?.[1]
                const columns = database
                  .prepare('SELECT name FROM pragma_table_info(?) WHERE name = ?')
                  .all(tableName as string, columnName as string)

                return { rows: [{ exists: columns.length > 0 }] }
              }

              if (compiled.sql.includes('information_schema.tables')) {
                const [, tableName] = compiled.params
                const tables = database
                  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
                  .all(tableName as string)

                return { rows: [{ exists: tables.length > 0 }] }
              }

              return {
                rows: database
                  .prepare(compiled.sql.replace(/\$\d+/g, '?'))
                  .all(...(compiled.params as any[])),
              }
            },
          },
          payload,
          sql,
        })
      } else {
        const sqliteDialect = new SQLiteSyncDialect()
        const query = ({ value }: { value: any }) => {
          const compiled = sqliteDialect.sqlToQuery(value)

          return database.prepare(compiled.sql).all(...(compiled.params as any[]))
        }

        await migrateSqliteLocalizeStatus({
          ...entityArgs,
          db: {
            all: (value) => query({ value }),
            get: (value) => query({ value })[0],
            run: (value) => query({ value }),
          },
          payload,
        })
      }

      if (hasMainLocales) {
        expect(
          database.prepare('SELECT _locale, _status FROM posts_locales ORDER BY _locale').all(),
        ).toEqual([
          { _locale: 'en', _status: 'published' },
          { _locale: 'es', _status: 'published' },
        ])
        expect(
          database
            .prepare("SELECT name FROM pragma_table_info('posts') WHERE name = '_status'")
            .all(),
        ).toEqual([])
      } else {
        expect(database.prepare('SELECT _status FROM posts').all()).toEqual([
          { _status: 'published' },
        ])
      }
    },
  )
})
