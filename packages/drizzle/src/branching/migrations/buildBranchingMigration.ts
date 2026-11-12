import type { DynamicMigrationTemplate } from 'payload'

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../../types.js'
import type { RowIDSnapshot } from './types.js'

import { buildRowIDMigration } from './buildRowIDMigration.js'

/** Generate the SQL adapter's complete, explicit branch-enablement migration. */
export const buildBranchingMigration = ({
  packageName,
}: {
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const branching = payload.config.branching

    if (!branching?.enabled) {
      throw new Error('Enable branching in the config before generating its migration.')
    }
    const adapter = payload.db as unknown as DrizzleAdapter
    const latest = readdirSync(adapter.migrationDir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .at(-1)

    if (!latest) {
      throw new Error(
        'The branching migration requires a schema snapshot matching the existing database before branching was enabled. ' +
          'Create and verify a baseline with the previous config first. Do not run an initial CREATE TABLE migration against existing data. ' +
          'See https://payloadcms.com/docs/branching/overview#database-indexes-and-migrations.',
      )
    }

    const { generateDrizzleJson, generateMigration, upSnapshot } = await adapter.requireDrizzleKit()
    const after = await generateDrizzleJson(adapter.schema)
    let before = JSON.parse(readFileSync(path.join(adapter.migrationDir, latest), 'utf8'))

    if (upSnapshot && before.version < after.version) {
      before = upSnapshot(before)
    }
    const tableKeys = getBranchOwnedTables({ adapter, snapshot: after as unknown as RowIDSnapshot })
    const { plan, snapshot } = await buildRowIDMigration({
      adapter,
      after,
      before,
      generateMigration,
      tableKeys,
    })
    const statements = await generateMigration(snapshot as never, after)
    const executeMethod = adapter.name === 'postgres' ? 'execute' : 'run'
    const schemaSQL = statements
      .map((statement) => `await db.${executeMethod}(sql.raw(${JSON.stringify(statement)}))`)
      .join('\n')
    const conversionSQL = plan
      ? `await migrateBranching({ db, plan: ${JSON.stringify(plan, null, 2)} })\n`
      : ''

    // Include all remaining branch columns, defaults, and indexes in the same
    // migration and write its final snapshot so the next diff cannot repeat it.
    writeFileSync(`${filePath}.json`, JSON.stringify(after, null, 2))

    return {
      downSQL:
        "throw new Error('Branch enablement is a forward-only migration. Restore a compatible backup or write a reviewed reverse migration before disabling branching.')",
      imports: plan ? `import { migrateBranching } from '${packageName}/migration-utils'` : '',
      upSQL: conversionSQL + schemaSQL || '// Branching schema is already up to date.',
    }
  }
}

/** Normal schema diffs cannot preserve these existing public row identities. */
export function requiresBranchingMigration({
  after,
  before,
}: {
  after: unknown
  before: unknown
}): boolean {
  const previous = before as RowIDSnapshot
  const next = after as RowIDSnapshot

  return Object.entries(previous.tables).some(([key, table]) => {
    const target = next.tables[key]

    return (
      target &&
      ((!table.columns._branch && target.columns._branch) ||
        (table.columns.id?.primaryKey &&
          table.columns._order &&
          table.columns._parent_id &&
          !table.columns._uuid &&
          target.columns._uuid))
    )
  })
}

function getBranchOwnedTables({
  adapter,
  snapshot,
}: {
  adapter: DrizzleAdapter
  snapshot: RowIDSnapshot
}): Set<string> {
  const branching = adapter.payload.config.branching
  const owned = new Set<string>()

  for (const slug of [...branching.branchableCollections, ...branching.branchableGlobals]) {
    const name = adapter.tableNameMap.get(toSnakeCase(slug))
    const key = Object.entries(snapshot.tables).find(
      ([, table]) =>
        table.name === name && (!table.schema || table.schema === (adapter.schemaName || 'public')),
    )?.[0]

    if (!key) {
      throw new Error(`Could not find the SQL table for branchable entity "${slug}".`)
    }
    owned.add(key)
  }

  let hasChanges = true

  while (hasChanges) {
    hasChanges = false
    for (const [key, table] of Object.entries(snapshot.tables)) {
      if (owned.has(key)) {
        continue
      }
      for (const foreignKey of Object.values(table.foreignKeys)) {
        if (
          !foreignKey.columnsFrom.some(
            (column) => column === '_parent_id' || column === 'parent_id',
          )
        ) {
          continue
        }
        const parent =
          snapshot.dialect === 'postgresql'
            ? `${foreignKey.schemaTo || table.schema || 'public'}.${foreignKey.tableTo}`
            : foreignKey.tableTo

        if (owned.has(parent)) {
          owned.add(key)
          hasChanges = true
        }
      }
    }
  }
  return owned
}
