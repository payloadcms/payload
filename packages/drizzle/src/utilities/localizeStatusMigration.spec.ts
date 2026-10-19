import { sql } from 'drizzle-orm'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { PgDialect } from 'drizzle-orm/pg-core'
import { integer, sqliteTable, SQLiteSyncDialect, text } from 'drizzle-orm/sqlite-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'

import { migratePostgresLocalizeStatus } from '../postgres/predefinedMigrations/localize-status/index.js'
import { migrateSqliteLocalizeStatus } from '../sqlite/predefinedMigrations/localize-status/index.js'
import { buildDynamicPredefinedLocalizeStatusMigration } from './buildDynamicPredefinedLocalizeStatusMigration.js'

const databases: DatabaseSync[] = []
const migrationDirs: string[] = []

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close()
  }
  for (const dir of migrationDirs.splice(0)) {
    fs.rmSync(dir, { force: true, recursive: true })
  }
})

function buildFollowUpSchema({ localized }: { localized: boolean }) {
  return {
    posts: sqliteTable('posts', {
      id: integer().primaryKey(),
      ...(!localized && { _status: text() }),
      ...(localized && { pending_change: text() }),
    }),
    versions: sqliteTable('_posts_v', {
      id: integer().primaryKey(),
      parent_id: integer(),
      published_locale: text(),
      created_at: text(),
      ...(!localized && { version__status: text(), snapshot: integer() }),
    }),
    versionLocales: sqliteTable('_posts_v_locales', {
      id: integer().primaryKey(),
      _parent_id: integer(),
      _locale: text(),
      ...(localized && { version__status: text() }),
    }),
    ...(localized && {
      locales: sqliteTable('posts_locales', {
        id: integer().primaryKey(),
        _parent_id: integer().notNull(),
        _locale: text().notNull(),
        _status: text().default('draft'),
      }),
    }),
  }
}

describe.each(['postgres', 'sqlite'])('localize-status main data (%s)', (dialect) => {
  it.each([
    { scenario: 'a collection with missing main locales', isGlobal: false, hasMainLocales: false },
    { scenario: 'a global with missing main locales', isGlobal: true, hasMainLocales: false },
    { scenario: 'a collection with existing main locales', isGlobal: false, hasMainLocales: true },
    { scenario: 'a global with existing main locales', isGlobal: true, hasMainLocales: true },
    {
      scenario: 'a collection without history',
      isGlobal: false,
      hasMainLocales: false,
      hasHistory: false,
    },
    {
      scenario: 'a global without history',
      isGlobal: true,
      hasMainLocales: false,
      hasHistory: false,
    },
    {
      scenario: 'a collection published in one locale',
      isGlobal: false,
      hasMainLocales: false,
      hasVersionLocales: false,
      publishedLocale: 'en',
    },
    {
      scenario: 'a global published in one locale',
      isGlobal: true,
      hasMainLocales: false,
      hasVersionLocales: false,
      publishedLocale: 'en',
    },
    {
      scenario: 'a collection with string IDs',
      isGlobal: false,
      hasMainLocales: false,
      hasStringID: true,
    },
    {
      scenario: 'a collection with numeric IDs',
      isGlobal: false,
      hasMainLocales: false,
      hasNumericID: true,
    },
    {
      scenario: 'a collection with UUID version IDs',
      isGlobal: false,
      hasMainLocales: false,
      hasVersionLocales: false,
      hasUUIDVersionID: true,
      hasStringID: true,
      publishedLocale: 'en',
    },
    {
      scenario: 'a global with UUID version IDs',
      isGlobal: true,
      hasMainLocales: false,
      hasVersionLocales: false,
      hasUUIDVersionID: true,
      hasStringID: true,
      publishedLocale: 'en',
    },
    {
      scenario: 'a collection with snapshot versions',
      isGlobal: false,
      hasMainLocales: false,
      hasVersionLocales: false,
      publishedLocale: 'en',
      hasSnapshot: true,
    },
    {
      scenario: 'a global with snapshot versions',
      isGlobal: true,
      hasMainLocales: false,
      hasVersionLocales: false,
      publishedLocale: 'en',
      hasSnapshot: true,
    },
  ])(
    'should preserve publication status for $scenario',
    async ({
      isGlobal,
      hasMainLocales,
      hasHistory,
      hasVersionLocales,
      publishedLocale,
      hasStringID,
      hasNumericID,
      hasUUIDVersionID,
      hasSnapshot,
    }) => {
      const database = new DatabaseSync(':memory:')

      databases.push(database)
      database.exec(`
      CREATE TABLE posts (id ${hasStringID ? 'TEXT' : hasNumericID ? 'NUMERIC' : 'INTEGER'} PRIMARY KEY, _status TEXT);
      INSERT INTO posts VALUES (${hasStringID ? "'post-1'" : hasNumericID ? 1.5 : 1}, 'published');
      CREATE TABLE _posts_v (id ${hasUUIDVersionID ? 'TEXT' : 'INTEGER'} PRIMARY KEY, parent_id ${hasStringID ? 'TEXT' : hasNumericID ? 'NUMERIC' : 'INTEGER'}, version__status TEXT, published_locale TEXT, snapshot INTEGER, created_at TEXT);
      INSERT INTO _posts_v VALUES (${hasUUIDVersionID ? "'version-1'" : 1}, ${hasStringID ? "'post-1'" : hasNumericID ? 1.5 : 1}, 'published', NULL, 0, '2026-01-01');
      CREATE TABLE _posts_v_locales (id INTEGER PRIMARY KEY, _parent_id INTEGER, _locale TEXT);
      INSERT INTO _posts_v_locales VALUES (1, 1, 'en'), (2, 1, 'es');
    `)

      if (hasHistory === false) {
        database.exec('DELETE FROM _posts_v_locales; DELETE FROM _posts_v;')
      }

      if (hasVersionLocales === false) {
        database.exec('DROP TABLE _posts_v_locales')
      }

      if (hasSnapshot) {
        database.exec("INSERT INTO _posts_v VALUES (2, 1, 'draft', NULL, 1, '2026-01-02')")
      }

      if (publishedLocale) {
        database
          .prepare('UPDATE _posts_v SET published_locale = ? WHERE snapshot = 0')
          .run(publishedLocale)
      }

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
      const shouldCheckFollowUp =
        dialect === 'sqlite' &&
        !isGlobal &&
        !hasMainLocales &&
        hasHistory === undefined &&
        hasVersionLocales === undefined &&
        !hasStringID &&
        !hasNumericID
      let snapshotPath: string | undefined

      if (shouldCheckFollowUp) {
        const migrationDir = fs.mkdtempSync(path.join(os.tmpdir(), 'status-follow-up-'))

        migrationDirs.push(migrationDir)
        fs.writeFileSync(
          path.join(migrationDir, '20260101_initial.json'),
          JSON.stringify(
            await generateSQLiteDrizzleJson(buildFollowUpSchema({ localized: false })),
          ),
        )
        payload.db = {
          migrationDir,
          schema: buildFollowUpSchema({ localized: true }),
          requireDrizzleKit: () => ({ generateDrizzleJson: generateSQLiteDrizzleJson }),
        }
        const filePath = path.join(migrationDir, '20260102_localize_status')

        await buildDynamicPredefinedLocalizeStatusMigration({
          packageName: '@payloadcms/db-sqlite',
        })({ filePath, payload })
        snapshotPath = `${filePath}.json`
      }

      if (dialect === 'postgres') {
        const pgDialect = new PgDialect()

        await migratePostgresLocalizeStatus({
          ...entityArgs,
          db: {
            // Run portable SQL against SQLite; emulate only PostgreSQL's catalog queries.
            execute: ({ sql: query }) => {
              const compiled = pgDialect.sqlToQuery(query)

              if (compiled.sql.includes('SELECT column_name, data_type')) {
                const [, tableName] = compiled.params
                const columns = database
                  .prepare('SELECT name, type FROM pragma_table_info(?)')
                  .all(tableName as string)

                return {
                  rows: columns.map((column) => ({
                    column_name: column.name,
                    data_type: String(column.type).toLowerCase(),
                  })),
                }
              }

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
                  .all(...(compiled.params as any[]))
                  .map((row) =>
                    Object.hasOwn(row, 'snapshot')
                      ? { ...row, snapshot: Boolean(row.snapshot) }
                      : row,
                  ),
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

      if (snapshotPath) {
        const statements = await generateSQLiteMigration(
          JSON.parse(fs.readFileSync(snapshotPath, 'utf8')),
          await generateSQLiteDrizzleJson(buildFollowUpSchema({ localized: true })),
        )

        for (const statement of statements) {
          database.exec(statement)
        }

        expect(
          database
            .prepare("SELECT name FROM pragma_table_info('posts') WHERE name = 'pending_change'")
            .all(),
        ).toHaveLength(1)
      }

      expect(
        database.prepare('SELECT _locale, _status FROM posts_locales ORDER BY _locale').all(),
      ).toEqual([
        { _locale: 'en', _status: 'published' },
        { _locale: 'es', _status: publishedLocale ? 'draft' : 'published' },
      ])
      expect(
        database
          .prepare("SELECT name FROM pragma_table_info('posts') WHERE name = '_status'")
          .all(),
      ).toEqual([])
    },
  )
})
