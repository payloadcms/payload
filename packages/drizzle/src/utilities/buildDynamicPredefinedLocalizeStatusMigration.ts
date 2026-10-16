import type { DynamicMigrationTemplate } from 'payload'

import { randomUUID } from 'crypto'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'

type SnapshotColumn = {
  autoincrement?: boolean
  default?: string
  name: string
  notNull: boolean
  primaryKey: boolean
  type: string
}

type SnapshotTable = {
  columns: Record<string, SnapshotColumn>
  indexes: Record<string, { columns: ({ expression: string } | string)[] }>
  name: string
  schema?: string
}

type Snapshot = {
  id: string
  prevId: string
  tables: Record<string, SnapshotTable>
  version: string
}

/**
 * Records only the schema changes performed by migrateLocalizeStatus, so later generated
 * migrations neither repeat them nor skip unrelated changes introduced by the upgrade.
 */
export const buildDynamicPredefinedLocalizeStatusMigration = ({
  packageName,
}: {
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as unknown as DrizzleAdapter
    const isPostgres = packageName === '@payloadcms/db-postgres'
    const latestSnapshot = readdirSync(adapter.migrationDir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .reverse()[0]

    if (latestSnapshot) {
      const { generateDrizzleJson, upSnapshot } = adapter.requireDrizzleKit()
      const currentVersion = (await generateDrizzleJson(adapter.schema)).version
      let previous = JSON.parse(
        readFileSync(`${adapter.migrationDir}/${latestSnapshot}`, 'utf8'),
      ) as Snapshot

      if (upSnapshot && previous.version < currentVersion) {
        previous = upSnapshot(previous) as unknown as Snapshot
      }

      const snapshot = structuredClone(previous)
      const entities = payload.config.localization
        ? [...payload.config.collections, ...payload.config.globals].filter(
            ({ versions }) =>
              versions &&
              versions.drafts &&
              typeof versions.drafts === 'object' &&
              versions.drafts.localizeStatus,
          )
        : []

      for (const { slug } of entities) {
        const tableName = toSnakeCase(slug)
        const schemaName = adapter.schemaName ?? 'public'
        const tableKey = isPostgres ? `${schemaName}.${tableName}` : tableName
        const versionsKey = isPostgres ? `${schemaName}._${tableName}_v` : `_${tableName}_v`
        const versions = snapshot.tables[versionsKey]

        if (!versions) {
          continue
        }

        if (versions.columns.version__status) {
          const localesKey = `${versionsKey}_locales`
          let locales = snapshot.tables[localesKey]

          if (!locales) {
            locales = buildVersionLocalesTable({ isPostgres, versions })
            snapshot.tables[localesKey] = locales
          }

          locales.columns.version__status = statusColumn({ isPostgres, name: 'version__status' })
          removeColumns({ names: ['version__status'], table: versions })

          const main = snapshot.tables[tableKey]
          const mainLocales = snapshot.tables[`${tableKey}_locales`]

          if (mainLocales && !mainLocales.columns._status) {
            mainLocales.columns._status = {
              ...statusColumn({ isPostgres, name: '_status' }),
              default: "'draft'",
            }
          }

          if (main && mainLocales) {
            removeColumns({ names: ['_status'], table: main })
          }
        }

        removeColumns({ names: ['snapshot'], table: versions })
      }

      snapshot.prevId = previous.id
      snapshot.id = randomUUID()
      writeFileSync(`${filePath}.json`, JSON.stringify(snapshot, null, 2))
    }

    return {
      imports: `import { migrateLocalizeStatus } from '${packageName}/migration-utils'`,
      upSQL: `  await migrateLocalizeStatus({ db, payload, req${isPostgres ? ', sql' : ''} })`,
    }
  }
}

function removeColumns({ names, table }: { names: string[]; table: SnapshotTable }): SnapshotTable {
  for (const name of names) {
    delete table.columns[name]
  }

  for (const [key, index] of Object.entries(table.indexes)) {
    if (
      index.columns.some((column) =>
        names.includes(typeof column === 'string' ? column : column.expression),
      )
    ) {
      delete table.indexes[key]
    }
  }

  return table
}

function statusColumn({ isPostgres, name }: { isPostgres: boolean; name: string }): SnapshotColumn {
  // The predefined migration creates VARCHAR/TEXT columns, not the config's enum columns.
  return {
    name,
    notNull: false,
    primaryKey: false,
    type: isPostgres ? 'varchar' : 'text',
    ...(!isPostgres && { autoincrement: false }),
  }
}

function buildVersionLocalesTable({
  isPostgres,
  versions,
}: {
  isPostgres: boolean
  versions: SnapshotTable
}): SnapshotTable {
  const name = `${versions.name}_locales`
  const column = ({
    columnName,
    notNull,
    type,
  }: {
    columnName: string
    notNull: boolean
    type: string
  }): SnapshotColumn => ({
    name: columnName,
    notNull,
    primaryKey: false,
    type,
    ...(!isPostgres && { autoincrement: false }),
  })

  return {
    name,
    ...(isPostgres && { schema: versions.schema ?? '' }),
    columns: {
      id: {
        name: 'id',
        notNull: true,
        primaryKey: true,
        type: isPostgres ? 'serial' : 'integer',
        ...(!isPostgres && { autoincrement: false }),
      },
      _locale: column({
        columnName: '_locale',
        notNull: true,
        type: isPostgres ? 'varchar' : 'text',
      }),
      _parent_id: column({ columnName: '_parent_id', notNull: true, type: 'integer' }),
    },
    indexes: {},
    foreignKeys: {
      [`${name}__parent_id_fkey`]: {
        name: `${name}__parent_id_fkey`,
        tableFrom: name,
        tableTo: versions.name,
        columnsFrom: ['_parent_id'],
        columnsTo: ['id'],
        onDelete: 'cascade',
        onUpdate: 'no action',
        ...(isPostgres && versions.schema && { schemaTo: versions.schema }),
      },
    },
    compositePrimaryKeys: {},
    uniqueConstraints: {
      [`${name}__locale__parent_id_key`]: {
        name: `${name}__locale__parent_id_key`,
        columns: ['_locale', '_parent_id'],
        ...(isPostgres && { nullsNotDistinct: false }),
      },
    },
    checkConstraints: {},
    ...(isPostgres && { policies: {}, isRLSEnabled: false }),
  } as SnapshotTable
}
