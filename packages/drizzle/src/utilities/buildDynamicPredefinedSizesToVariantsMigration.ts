import type { DynamicMigrationTemplate } from 'payload'

import { randomUUID } from 'crypto'
import { readdirSync, readFileSync, writeFileSync } from 'fs'

import type { DrizzleAdapter } from '../types.js'
import type { SizesToVariantsTableRenames } from './getSizesToVariantsRenames.js'

import {
  findSizesToVariantsFieldCollision,
  getSizesToVariantsRenames,
} from './getSizesToVariantsRenames.js'

type SnapshotIndex = {
  columns: ({ expression: string } | string)[]
  name: string
}

type SnapshotTable = {
  columns: Record<string, { name: string }>
  indexes?: Record<string, SnapshotIndex>
  name: string
}

type Snapshot = {
  id?: string
  prevId?: string
  tables: Record<string, SnapshotTable>
  version: string
}

/**
 * Builds the `sizes-to-variants` predefined migration for a SQL adapter. The migration renames
 * columns rather than letting drizzle-kit diff the schema (which would drop and re-add them,
 * losing every stored image size).
 *
 * It also writes a schema snapshot: the project's previous snapshot with only these renames
 * applied. The next generated migration then diffs from the renamed columns instead of dropping
 * them, and still picks up every other schema change the upgrade brings. Without a previous
 * snapshot (a project that has only ever used `push`) there's nothing to update, so none is written.
 */
export const buildDynamicPredefinedSizesToVariantsMigration = ({
  packageName,
}: {
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as unknown as DrizzleAdapter
    const previousSnapshot = await readLatestSnapshot({ adapter })

    if (previousSnapshot) {
      const renamedSnapshot = applySizesToVariantsRenames({
        plan: getSizesToVariantsRenames({ adapter, direction: 'up' }),
        snapshot: previousSnapshot,
      })

      writeFileSync(`${filePath}.json`, JSON.stringify(renamedSnapshot, null, 2))
    }

    return {
      downSQL: `  await migrateSizesToVariants({ db, direction: 'down', payload })`,
      imports: `import { migrateSizesToVariants } from '${packageName}/migration-utils'`,
      upSQL: `  await migrateSizesToVariants({ db, payload })`,
    }
  }
}

/** The latest snapshot in the migrations directory, upgraded to drizzle-kit's current format. */
async function readLatestSnapshot({
  adapter,
}: {
  adapter: DrizzleAdapter
}): Promise<Snapshot | undefined> {
  const dir = adapter.migrationDir
  const latestSnapshotFile = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()[0]

  if (!latestSnapshotFile) {
    return undefined
  }

  const { generateDrizzleJson, upSnapshot } = adapter.requireDrizzleKit()
  const currentVersion = (await generateDrizzleJson(adapter.schema)).version
  const snapshot = JSON.parse(readFileSync(`${dir}/${latestSnapshotFile}`, 'utf8')) as Snapshot

  return upSnapshot && snapshot.version < currentVersion ? upSnapshot(snapshot) : snapshot
}

function applySizesToVariantsRenames({
  plan,
  snapshot,
}: {
  plan: SizesToVariantsTableRenames[]
  snapshot: Snapshot
}): Snapshot {
  const renamed: Snapshot = structuredClone(snapshot)

  for (const { columns, indexes, tableName } of plan) {
    const table = Object.values(renamed.tables).find(({ name }) => name === tableName)

    if (!table) {
      continue
    }

    const existingColumns = new Set(Object.values(table.columns).map(({ name }) => name))

    for (const { from, to } of columns) {
      if (existingColumns.has(from) && existingColumns.has(to)) {
        throw new Error(
          `Cannot create the sizes-to-variants migration because snapshot table "${tableName}" contains both "${from}" and "${to}". Move or rename the existing destination data before creating this migration.`,
        )
      }
    }

    const fieldCollision = findSizesToVariantsFieldCollision({ columns, existingColumns })

    if (fieldCollision) {
      throw new Error(
        `Cannot create the sizes-to-variants migration because snapshot table "${tableName}" contains both the "${fieldCollision.from}" and "${fieldCollision.to}" fields. Move or rename the existing destination data before creating this migration.`,
      )
    }

    for (const { from, to } of columns) {
      const column = table.columns[from]

      if (column) {
        if (table.columns[to]) {
          throw new Error(
            `Cannot create the sizes-to-variants migration because snapshot table "${tableName}" contains both "${from}" and "${to}". Move or rename the existing destination data before creating this migration.`,
          )
        }

        delete table.columns[from]
        table.columns[to] = { ...column, name: to }
      }
    }

    for (const [key, index] of Object.entries(table.indexes ?? {})) {
      const indexColumns = index.columns.map((column) => {
        const name = typeof column === 'string' ? column : column.expression
        const renamedName = columns.find(({ from }) => from === name)?.to ?? name

        return typeof column === 'string' ? renamedName : { ...column, expression: renamedName }
      })
      const indexColumnNames = indexColumns.map((column) =>
        typeof column === 'string' ? column : column.expression,
      )
      const target = indexes.find(
        (planned) => planned.columns.join(',') === indexColumnNames.join(','),
      )

      if (!target) {
        continue
      }

      if (key !== target.to && table.indexes?.[target.to]) {
        throw new Error(
          `Cannot create the sizes-to-variants migration because snapshot table "${tableName}" contains both indexes "${key}" and "${target.to}". Move or rename the existing destination index before creating this migration.`,
        )
      }

      delete table.indexes[key]
      table.indexes[target.to] = { ...index, name: target.to, columns: indexColumns }
    }
  }

  renamed.prevId = snapshot.id
  renamed.id = randomUUID()

  return renamed
}
