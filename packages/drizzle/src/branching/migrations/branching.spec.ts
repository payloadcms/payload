import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
  pushSQLiteSchema,
} from 'drizzle-kit/api'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { buildCreateMigration } from '../../utilities/buildCreateMigration.js'
import { buildBranchingMigration } from './buildBranchingMigration.js'
import { migrateSQLBranching } from './migrateBranching.js'

describe('SQL branch-enablement migration', () => {
  it.each(['number', 'uuid', 'uuidv7'] as const)(
    'should preserve existing content and migrate only branchable owners with %s keys',
    async (idType) => {
      const fixture = await setup({ idType })
      const { client, db, directory, payload, target } = fixture

      try {
        await db.run(sql`INSERT INTO pages (id, slug) VALUES (1, 'welcome')`)
        await db.run(
          sql`INSERT INTO pages_items (id, _parent_id, label) VALUES ('row-id', 1, 'Parent')`,
        )
        await db.run(
          sql`INSERT INTO pages_items_nested (id, _parent_id, label) VALUES ('nested-id', 'row-id', 'Child')`,
        )
        await db.run(
          sql`INSERT INTO pages_items_locales (id, _parent_id, label) VALUES (27, 'row-id', 'Traduit')`,
        )
        await db.run(
          sql`INSERT INTO pages_blocks_content (id, _parent_id, _path) VALUES ('block-id', 1, 'layout')`,
        )
        await db.run(sql`INSERT INTO header (id) VALUES (1)`)
        await db.run(sql`INSERT INTO header_items (id, _parent_id) VALUES ('global-row-id', 1)`)
        await db.run(sql`INSERT INTO excluded (id, page_id) VALUES (1, 1)`)
        await db.run(sql`INSERT INTO excluded_items (id, _parent_id) VALUES ('excluded-row-id', 1)`)
        const physicalVersionID = idType === 'number' ? 23 : uuidv4()

        await db.run(sql`INSERT INTO _pages_v (id, parent_id) VALUES (1, 1)`)
        await db.run(
          sql`INSERT INTO _pages_v_version_items (id, _uuid, _parent_id) VALUES (${physicalVersionID}, 'version-row-id', 1)`,
        )
        const result = await buildBranchingMigration({ packageName: '@payloadcms/db-sqlite' })({
          filePath: path.join(directory, 'enable_branching'),
          payload: payload as never,
        })
        const execute = new Function(
          'db',
          'migrateBranching',
          'sql',
          `return (async () => { ${result.upSQL} })()`,
        )

        await execute(db, migrateSQLBranching, sql)
        expect(await db.all(sql`SELECT _branch FROM pages`)).toEqual([{ _branch: 'main' }])
        expect(await db.all(sql`SELECT _branch FROM header`)).toEqual([{ _branch: 'main' }])
        expect(await db.all(sql`SELECT _branch FROM _pages_v`)).toEqual([{ _branch: 'main' }])
        expect(
          await db.all(
            sql`SELECT child._uuid, parent._uuid AS parent FROM pages_items_nested child JOIN pages_items parent ON child._parent_id = parent.id`,
          ),
        ).toEqual([{ _uuid: 'nested-id', parent: 'row-id' }])
        expect(
          await db.all(
            sql`SELECT child.label FROM pages_items_locales child JOIN pages_items parent ON child._parent_id = parent.id`,
          ),
        ).toEqual([{ label: 'Traduit' }])
        expect(await db.all(sql`SELECT _uuid, _path FROM pages_blocks_content`)).toEqual([
          { _uuid: 'block-id', _path: 'layout' },
        ])
        expect(await db.all(sql`SELECT _uuid FROM header_items`)).toEqual([
          { _uuid: 'global-row-id' },
        ])
        expect(await db.all(sql`SELECT id FROM excluded_items`)).toEqual([
          { id: 'excluded-row-id' },
        ])
        expect(await db.all(sql`SELECT id, _uuid FROM _pages_v_version_items`)).toEqual([
          { id: physicalVersionID, _uuid: 'version-row-id' },
        ])
        expect(await db.all(sql`PRAGMA foreign_key_check`)).toEqual([])
        const drift = await pushSQLiteSchema(target, db)

        expect(drift.statementsToExecute).toEqual([])
        await db.run(sql`INSERT INTO pages (id, slug, _branch) VALUES (2, 'welcome', 'demo')`)
        await db
          .insert(target.items)
          .values({ _uuid: 'row-id', _parent_id: 2, label: 'Branch copy' })
        expect(
          await db.all(sql`SELECT count(*) AS count FROM pages_items WHERE _uuid = 'row-id'`),
        ).toEqual([{ count: 2 }])
        expect(
          JSON.parse(readFileSync(path.join(directory, 'enable_branching.json'), 'utf8')),
        ).toEqual(fixture.after)
        expect(() => new Function(result.downSQL)()).toThrow('forward-only')
      } finally {
        client.close()
        rmSync(directory, { recursive: true, force: true })
      }
    },
  )

  it('should migrate empty legacy array/block tables', async () => {
    const fixture = await setup({ idType: 'number' })

    try {
      const result = await buildBranchingMigration({ packageName: '@payloadcms/db-sqlite' })({
        filePath: path.join(fixture.directory, 'empty'),
        payload: fixture.payload as never,
      })
      const execute = new Function(
        'db',
        'migrateBranching',
        'sql',
        `return (async () => { ${result.upSQL} })()`,
      )

      await execute(fixture.db, migrateSQLBranching, sql)
      expect(await fixture.db.all(sql`SELECT _uuid FROM pages_items`)).toEqual([])
      expect(await fixture.db.all(sql`PRAGMA foreign_key_check`)).toEqual([])
    } finally {
      fixture.client.close()
      rmSync(fixture.directory, { recursive: true, force: true })
    }
  })

  it('should enable branching without arrays and retain later branch values on retry', async () => {
    const fixture = await setup({ idType: 'number', hasNestedTables: false })

    try {
      await fixture.db.run(sql`INSERT INTO pages (id, slug) VALUES (1, 'welcome')`)
      const result = await buildBranchingMigration({ packageName: '@payloadcms/db-sqlite' })({
        filePath: path.join(fixture.directory, 'roots'),
        payload: fixture.payload as never,
      })
      const execute = new Function(
        'db',
        'migrateBranching',
        'sql',
        `return (async () => { ${result.upSQL} })()`,
      )

      await execute(fixture.db, migrateSQLBranching, sql)
      await fixture.db.run(
        sql`INSERT INTO pages (id, slug, _branch, _branch_doc_id) VALUES (2, 'welcome', 'demo', 1)`,
      )
      await execute(fixture.db, migrateSQLBranching, sql)
      expect(
        await fixture.db.all(sql`SELECT id, _branch, _branch_doc_id FROM pages ORDER BY id`),
      ).toEqual([
        { id: 1, _branch: 'main', _branch_doc_id: null },
        { id: 2, _branch: 'demo', _branch_doc_id: 1 },
      ])
      expect(await fixture.db.all(sql`PRAGMA foreign_key_check`)).toEqual([])
    } finally {
      fixture.client.close()
      rmSync(fixture.directory, { recursive: true, force: true })
    }
  })

  it('should backfill a pre-existing null branch identity before enforcing its constraints', async () => {
    const fixture = await setup({ idType: 'number', hasNullableBranch: true })

    try {
      await fixture.db.run(sql`INSERT INTO pages (id, slug) VALUES (1, 'welcome')`)
      await fixture.db.run(sql`INSERT INTO pages_items (id, _parent_id) VALUES ('row-id', 1)`)
      const result = await buildBranchingMigration({ packageName: '@payloadcms/db-sqlite' })({
        filePath: path.join(fixture.directory, 'nullable'),
        payload: fixture.payload as never,
      })
      const execute = new Function(
        'db',
        'migrateBranching',
        'sql',
        `return (async () => { ${result.upSQL} })()`,
      )

      await execute(fixture.db, migrateSQLBranching, sql)
      expect(await fixture.db.all(sql`SELECT _branch FROM pages`)).toEqual([{ _branch: 'main' }])
      expect(await fixture.db.all(sql`SELECT _uuid FROM pages_items`)).toEqual([
        { _uuid: 'row-id' },
      ])
    } finally {
      fixture.client.close()
      rmSync(fixture.directory, { recursive: true, force: true })
    }
  })

  it('should require a baseline and leave the existing database untouched', async () => {
    const fixture = await setup({ idType: 'number' })

    try {
      rmSync(path.join(fixture.directory, 'previous.json'))
      await expect(
        buildBranchingMigration({ packageName: '@payloadcms/db-sqlite' })({
          filePath: path.join(fixture.directory, 'migration'),
          payload: fixture.payload as never,
        }),
      ).rejects.toThrow('schema snapshot')
      expect(readdirSync(fixture.directory)).toEqual([])
      expect(
        (await fixture.db.all<{ name: string }>(sql`PRAGMA table_info(pages_items)`)).some(
          ({ name }) => name === '_uuid',
        ),
      ).toBe(false)
    } finally {
      fixture.client.close()
      rmSync(fixture.directory, { recursive: true, force: true })
    }
  })

  it('should stop a normal migration from generating a destructive row-ID conversion', async () => {
    const fixture = await setup({ idType: 'number' })

    try {
      const create = buildCreateMigration({
        executeMethod: 'run',
        filename: import.meta.filename,
        sanitizeStatements: () => 'unexpected SQL',
      })

      await expect(
        create.call(
          fixture.adapter as never,
          {
            payload: fixture.payload,
            shouldPrompt: false,
            migrationName: 'enable_branching',
          } as never,
        ),
      ).rejects.toThrow('--file @payloadcms/db-sqlite/branching')
      expect(readdirSync(fixture.directory)).toEqual(['previous.json'])
    } finally {
      fixture.client.close()
      rmSync(fixture.directory, { recursive: true, force: true })
    }
  })
})

async function setup({
  idType,
  hasNestedTables = true,
  hasNullableBranch = false,
}: {
  idType: 'number' | 'uuid' | 'uuidv7'
  hasNestedTables?: boolean
  hasNullableBranch?: boolean
}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'payload-enable-branching-'))
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client)
  const makeSchema = ({ enabled }: { enabled: boolean }) => {
    const physicalID = () =>
      idType === 'number'
        ? integer('id').primaryKey()
        : text('id')
            .primaryKey()
            .$defaultFn(idType === 'uuidv7' ? uuidv7 : uuidv4)
    const identity = () =>
      enabled ? { id: physicalID(), _uuid: text('_uuid') } : { id: text('id').primaryKey() }
    const branch = () =>
      enabled
        ? { _branch: text('_branch').notNull().default('main') }
        : hasNullableBranch
          ? { _branch: text('_branch') }
          : {}
    const pages = sqliteTable(
      'pages',
      {
        id: integer('id').primaryKey(),
        slug: text('slug'),
        ...branch(),
        ...(enabled
          ? { _branch_doc_id: integer('_branch_doc_id').references(() => pages.id) }
          : {}),
      },
      (table) => [
        uniqueIndex('pages_slug_idx').on(...(enabled ? [table._branch, table.slug] : [table.slug])),
      ],
    )
    const items = sqliteTable('pages_items', {
      ...identity(),
      _order: integer('_order').notNull().default(1),
      _parent_id: integer('_parent_id')
        .notNull()
        .references(() => pages.id, { onDelete: 'cascade' }),
      label: text('label'),
    })
    const nested = sqliteTable('pages_items_nested', {
      ...identity(),
      _order: integer('_order').notNull().default(1),
      _parent_id: (enabled && idType === 'number' ? integer('_parent_id') : text('_parent_id'))
        .notNull()
        .references(() => items.id, { onDelete: 'cascade' }),
      label: text('label'),
    })
    const localized = sqliteTable('pages_items_locales', {
      id: integer('id').primaryKey(),
      _parent_id: (enabled && idType === 'number' ? integer('_parent_id') : text('_parent_id'))
        .notNull()
        .references(() => items.id, { onDelete: 'cascade' }),
      label: text('label'),
    })
    const blocks = sqliteTable('pages_blocks_content', {
      ...identity(),
      _order: integer('_order').notNull().default(1),
      _parent_id: integer('_parent_id')
        .notNull()
        .references(() => pages.id, { onDelete: 'cascade' }),
      _path: text('_path'),
    })
    const header = sqliteTable('header', { id: integer('id').primaryKey(), ...branch() })
    const headerItems = sqliteTable('header_items', {
      ...identity(),
      _order: integer('_order').notNull().default(1),
      _parent_id: integer('_parent_id')
        .notNull()
        .references(() => header.id, { onDelete: 'cascade' }),
    })
    const excluded = sqliteTable('excluded', {
      id: integer('id').primaryKey(),
      page_id: integer('page_id').references(() => pages.id),
    })
    const excludedItems = sqliteTable('excluded_items', {
      id: text('id').primaryKey(),
      _order: integer('_order').notNull().default(1),
      _parent_id: integer('_parent_id')
        .notNull()
        .references(() => excluded.id, { onDelete: 'cascade' }),
    })
    const versions = sqliteTable('_pages_v', {
      id: integer('id').primaryKey(),
      parent_id: integer('parent_id').references(() => pages.id),
      ...branch(),
    })
    const versionItems = sqliteTable('_pages_v_version_items', {
      id: physicalID(),
      _uuid: text('_uuid'),
      _order: integer('_order').notNull().default(1),
      _parent_id: integer('_parent_id')
        .notNull()
        .references(() => versions.id, { onDelete: 'cascade' }),
    })

    if (!hasNestedTables) {
      return { pages, header, excluded }
    }
    return {
      pages,
      items,
      nested,
      localized,
      blocks,
      header,
      headerItems,
      excluded,
      excludedItems,
      versions,
      versionItems,
    }
  }
  const before = await generateSQLiteDrizzleJson(makeSchema({ enabled: false }))
  const target = makeSchema({ enabled: true })
  const after = await generateSQLiteDrizzleJson(target)
  const empty = await generateSQLiteDrizzleJson({})

  for (const statement of await generateSQLiteMigration(empty, before))
    await db.run(sql.raw(statement))
  writeFileSync(path.join(directory, 'previous.json'), JSON.stringify(before))
  const payload = {
    config: {
      branching: {
        enabled: true,
        branchableCollections: new Set(['pages']),
        branchableGlobals: new Set(['header']),
      },
    },
    logger: { info: () => {} },
  }
  const adapter = {
    name: 'sqlite',
    idType,
    packageName: '@payloadcms/db-sqlite',
    payload,
    migrationDir: directory,
    schema: target,
    defaultDrizzleSnapshot: empty,
    tableNameMap: new Map([
      ['pages', 'pages'],
      ['header', 'header'],
    ]),
    requireDrizzleKit: () => ({
      generateDrizzleJson: () => after,
      generateMigration: generateSQLiteMigration,
    }),
  }

  return {
    adapter,
    after,
    before,
    client,
    db,
    directory,
    payload: { ...payload, db: adapter },
    target,
  }
}
