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
            locales = buildLocalesTable({ isPostgres, parentTable: versions })
            snapshot.tables[localesKey] = locales
          }

          locales.columns.version__status = statusColumn({ name: 'version__status', isPostgres })
          removeColumns({ names: ['version__status'], table: versions })

          const main = snapshot.tables[tableKey]
          let mainLocales = snapshot.tables[`${tableKey}_locales`]

          if (main && !mainLocales) {
            mainLocales = buildLocalesTable({ isPostgres, parentTable: main })
            snapshot.tables[`${tableKey}_locales`] = mainLocales
          }

          if (mainLocales && !mainLocales.columns._status) {
            mainLocales.columns._status = {
              ...statusColumn({ name: '_status', isPostgres }),
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

function statusColumn({ name, isPostgres }: { isPostgres: boolean; name: string }): SnapshotColumn {
  // The predefined migration creates VARCHAR/TEXT columns, not the config's enum columns.
  return {
    name,
    type: isPostgres ? 'varchar' : 'text',
    notNull: false,
    primaryKey: false,
    ...(!isPostgres && { autoincrement: false }),
  }
}

function buildLocalesTable({
  isPostgres,
  parentTable,
}: {
  isPostgres: boolean
  parentTable: SnapshotTable
}): SnapshotTable {
  const name = `${parentTable.name}_locales`
  const idType = parentTable.columns.id.type
  const parentIDType =
    { bigserial: 'bigint', serial: 'integer', smallserial: 'smallint' }[idType] ??
    (isPostgres && idType.startsWith('varchar(') ? 'varchar' : idType)
  const column = ({
    type,
    columnName,
    notNull,
  }: {
    columnName: string
    notNull: boolean
    type: string
  }): SnapshotColumn => ({
    name: columnName,
    type,
    notNull,
    primaryKey: false,
    ...(!isPostgres && { autoincrement: false }),
  })

  return {
    name,
    ...(isPostgres && { schema: parentTable.schema ?? '' }),
    checkConstraints: {},
    columns: {
      id: {
        name: 'id',
        type: isPostgres ? 'serial' : 'integer',
        notNull: true,
        primaryKey: true,
        ...(!isPostgres && { autoincrement: false }),
      },
      _locale: column({
        type: isPostgres ? 'varchar' : 'text',
        columnName: '_locale',
        notNull: true,
      }),
      _parent_id: column({ type: parentIDType, columnName: '_parent_id', notNull: true }),
    },
    compositePrimaryKeys: {},
    foreignKeys: {
      [`${name}__parent_id_fkey`]: {
        name: `${name}__parent_id_fkey`,
        columnsFrom: ['_parent_id'],
        columnsTo: ['id'],
        onDelete: 'cascade',
        onUpdate: 'no action',
        tableFrom: name,
        tableTo: parentTable.name,
        ...(isPostgres && parentTable.schema && { schemaTo: parentTable.schema }),
      },
    },
    indexes: {},
    uniqueConstraints: {
      [`${name}__locale__parent_id_key`]: {
        name: `${name}__locale__parent_id_key`,
        columns: ['_locale', '_parent_id'],
        ...(isPostgres && { nullsNotDistinct: false }),
      },
    },
    ...(isPostgres && { isRLSEnabled: false, policies: {} }),
  } as SnapshotTable
}
