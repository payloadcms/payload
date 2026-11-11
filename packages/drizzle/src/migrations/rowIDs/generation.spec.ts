import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'

import { buildCreateMigration } from '../../utilities/buildCreateMigration.js'

it('should emit executable row migration calls and the final snapshot alongside unrelated schema changes', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'payload-row-id-generation-'))

  try {
    const before = await generateSQLiteDrizzleJson({
      rows: sqliteTable('rows', {
        id: text('id').primaryKey(),
        _order: integer('_order'),
        _parent_id: integer('_parent_id'),
      }),
    })
    const after = await generateSQLiteDrizzleJson({
      rows: sqliteTable('rows', {
        id: integer('id').primaryKey(),
        _uuid: text('_uuid'),
        _order: integer('_order'),
        _parent_id: integer('_parent_id'),
        newField: text('new_field'),
      }),
    })
    writeFileSync(path.join(directory, 'previous.json'), JSON.stringify(before))
    const adapter = {
      idType: 'number',
      packageName: '@payloadcms/db-sqlite',
      migrationDir: directory,
      requireDrizzleKit: () => ({
        generateDrizzleJson: () => after,
        generateMigration: generateSQLiteMigration,
      }),
      defaultDrizzleSnapshot: { ...before, tables: {} },
      schema: {},
    }
    const payload = { db: adapter, logger: { info: () => {} } }
    const create = buildCreateMigration({
      executeMethod: 'run',
      filename: import.meta.filename,
      sanitizeStatements: ({ sqlExecute, statements }) =>
        statements
          .map((statement) => `${sqlExecute}${statement.replaceAll('`', '\\`')}\`)`)
          .join('\n'),
    })

    await create.call(
      adapter as never,
      { payload, migrationName: 'uniform-row-ids', shouldPrompt: false } as never,
    )
    const migrationFile = readdirSync(directory).find(
      (file) => file.endsWith('.ts') && file !== 'index.ts',
    )
    const code = readFileSync(path.join(directory, migrationFile), 'utf8')

    expect(code).toContain(
      "import { migrateSQLRowIDs } from '@payloadcms/db-sqlite/migration-utils'",
    )
    expect(code.match(/await migrateSQLRowIDs/g)).toHaveLength(2)
    expect(code).toContain('new_field')
    expect(
      JSON.parse(readFileSync(path.join(directory, migrationFile.replace('.ts', '.json')), 'utf8')),
    ).toEqual(after)
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
})
