import {
  generateDrizzleJson,
  generateMigration,
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from 'drizzle-kit/api'
import {
  index as pgIndex,
  integer as pgInteger,
  pgSchema,
  serial,
  varchar,
} from 'drizzle-orm/pg-core'
import { index as sqliteIndex, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { buildDynamicPredefinedLocalizeStatusMigration } from './buildDynamicPredefinedLocalizeStatusMigration.js'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { force: true, recursive: true })
  }
})

function buildSchema({
  dialect,
  localized,
  extra = false,
}: {
  dialect: string
  localized: boolean
  extra?: boolean
}) {
  if (dialect === 'postgres') {
    const schema = pgSchema('cms')
    return {
      posts: schema.table(
        'posts',
        {
          id: serial().primaryKey(),
          ...(!localized && { _status: varchar().default('draft') }),
        },
        (table) => (localized ? [] : [pgIndex('posts_status_idx').on(table._status)]),
      ),
      versions: schema.table('_posts_v', {
        id: serial().primaryKey(),
        ...(!localized && { version__status: varchar(), snapshot: pgInteger() }),
      }),
      locales: schema.table('posts_locales', {
        id: serial().primaryKey(),
        title: varchar(),
        ...(localized && { _status: varchar().default('draft') }),
        ...(extra && { pending_change: varchar() }),
      }),
      versionLocales: schema.table('_posts_v_locales', {
        id: serial().primaryKey(),
        _locale: varchar().notNull(),
        _parent_id: pgInteger().notNull(),
        title: varchar(),
        ...(localized && { version__status: varchar() }),
      }),
      unrelated: schema.table('unrelated', {
        id: serial().primaryKey(),
        ...(extra && { new_field: varchar() }),
      }),
    }
  }

  return {
    posts: sqliteTable(
      'posts',
      {
        id: integer().primaryKey(),
        ...(!localized && { _status: text().default('draft') }),
      },
      (table) => (localized ? [] : [sqliteIndex('posts_status_idx').on(table._status)]),
    ),
    versions: sqliteTable('_posts_v', {
      id: integer().primaryKey(),
      ...(!localized && { version__status: text(), snapshot: integer() }),
    }),
    locales: sqliteTable('posts_locales', {
      id: integer().primaryKey(),
      title: text(),
      ...(localized && { _status: text().default('draft') }),
      ...(extra && { pending_change: text() }),
    }),
    versionLocales: sqliteTable('_posts_v_locales', {
      id: integer().primaryKey(),
      _locale: text().notNull(),
      _parent_id: integer().notNull(),
      title: text(),
      ...(localized && { version__status: text() }),
    }),
    unrelated: sqliteTable('unrelated', {
      id: integer().primaryKey(),
      ...(extra && { new_field: text() }),
    }),
  }
}

describe.each(['postgres', 'sqlite'])('localize-status snapshot (%s)', (dialect) => {
  const generate = dialect === 'postgres' ? generateDrizzleJson : generateSQLiteDrizzleJson
  const diff = dialect === 'postgres' ? generateMigration : generateSQLiteMigration

  async function setup({
    hasSnapshot = true,
    isGlobal = false,
  }: { hasSnapshot?: boolean; isGlobal?: boolean } = {}) {
    const migrationDir = fs.mkdtempSync(path.join(os.tmpdir(), 'localize-status-snapshot-'))
    tempDirs.push(migrationDir)
    const before = await generate(buildSchema({ dialect, localized: false }) as any)
    if (hasSnapshot) {
      fs.writeFileSync(path.join(migrationDir, '20260101_initial.json'), JSON.stringify(before))
    }
    const entity = { slug: 'posts', versions: { drafts: { localizeStatus: true } } }
    const payload = {
      config: {
        localization: { localeCodes: ['en', 'es'] },
        collections: isGlobal ? [] : [entity],
        globals: isGlobal ? [entity] : [],
      },
      db: {
        migrationDir,
        schemaName: dialect === 'postgres' ? 'cms' : undefined,
        schema: buildSchema({ dialect, localized: true, extra: true }),
        requireDrizzleKit: () => ({ generateDrizzleJson: generate }),
      },
    } as any
    const filePath = path.join(migrationDir, '20260102_localize_status')
    return { before, filePath, payload }
  }

  it.each([false, true])(
    'should snapshot only the migrated status schema (global: %s)',
    async (isGlobal) => {
      const { before, filePath, payload } = await setup({ isGlobal })

      const result = await buildDynamicPredefinedLocalizeStatusMigration({
        packageName: `@payloadcms/db-${dialect}`,
      })({ filePath, payload })

      expect(fs.existsSync(`${filePath}.json`)).toBe(true)
      const written = JSON.parse(fs.readFileSync(`${filePath}.json`, 'utf8'))
      const expected = await generate(buildSchema({ dialect, localized: true }) as any)
      expect(await diff(written, expected as any)).toEqual([])
      expect(written.prevId).toBe(before.id)
      expect(written.id).not.toBe(before.id)
      expect(result.upSQL).toContain('migrateLocalizeStatus')
      const pending = await diff(written, (await generate(payload.db.schema)) as any)
      expect(pending.join('\n')).toContain('pending_change')
      expect(pending.join('\n')).toContain('new_field')
      expect(pending.join('\n')).not.toContain('DROP COLUMN')
    },
  )

  it('should not invent a snapshot for a project without migration history', async () => {
    const { filePath, payload } = await setup({ hasSnapshot: false })

    await buildDynamicPredefinedLocalizeStatusMigration({
      packageName: `@payloadcms/db-${dialect}`,
    })({ filePath, payload })

    expect(fs.existsSync(`${filePath}.json`)).toBe(false)
  })

  it('should record the bare version locales table created by the migration', async () => {
    const { before, filePath, payload } = await setup()
    const key = dialect === 'postgres' ? 'cms._posts_v_locales' : '_posts_v_locales'
    delete before.tables[key]
    fs.writeFileSync(
      path.join(payload.db.migrationDir, '20260101_initial.json'),
      JSON.stringify(before),
    )

    await buildDynamicPredefinedLocalizeStatusMigration({
      packageName: `@payloadcms/db-${dialect}`,
    })({ filePath, payload })

    const written = JSON.parse(fs.readFileSync(`${filePath}.json`, 'utf8'))
    expect(Object.keys(written.tables[key].columns).sort()).toEqual([
      '_locale',
      '_parent_id',
      'id',
      'version__status',
    ])
    const statements = await diff(written, (await generate(payload.db.schema)) as any)
    expect(statements.join('\n')).not.toMatch(/CREATE TABLE [`"](?:cms[`.]+)?_posts_v_locales/)
    expect(statements.join('\n')).toContain('title')
  })

  it('should handle a previous schema without the obsolete snapshot column', async () => {
    const { before, filePath, payload } = await setup()
    const key = dialect === 'postgres' ? 'cms._posts_v' : '_posts_v'
    delete before.tables[key].columns.snapshot
    fs.writeFileSync(
      path.join(payload.db.migrationDir, '20260101_initial.json'),
      JSON.stringify(before),
    )

    await buildDynamicPredefinedLocalizeStatusMigration({
      packageName: `@payloadcms/db-${dialect}`,
    })({ filePath, payload })

    const written = JSON.parse(fs.readFileSync(`${filePath}.json`, 'utf8'))
    expect(
      await diff(
        written,
        (await generate(buildSchema({ dialect, localized: true }) as any)) as any,
      ),
    ).toEqual([])
  })

  it('should preserve main status when the destination locales table is missing', async () => {
    const { before, filePath, payload } = await setup()
    const mainKey = dialect === 'postgres' ? 'cms.posts' : 'posts'

    delete before.tables[`${mainKey}_locales`]
    fs.writeFileSync(
      path.join(payload.db.migrationDir, '20260101_initial.json'),
      JSON.stringify(before),
    )

    await buildDynamicPredefinedLocalizeStatusMigration({
      packageName: `@payloadcms/db-${dialect}`,
    })({ filePath, payload })

    const written = JSON.parse(fs.readFileSync(`${filePath}.json`, 'utf8'))

    expect(written.tables[mainKey]).toEqual(before.tables[mainKey])
  })

  it('should leave entities without localized status unchanged', async () => {
    const { before, filePath, payload } = await setup()
    payload.config.collections[0].versions.drafts.localizeStatus = false

    await buildDynamicPredefinedLocalizeStatusMigration({
      packageName: `@payloadcms/db-${dialect}`,
    })({ filePath, payload })

    const written = JSON.parse(fs.readFileSync(`${filePath}.json`, 'utf8'))
    expect(written.tables).toEqual(before.tables)
  })
})
