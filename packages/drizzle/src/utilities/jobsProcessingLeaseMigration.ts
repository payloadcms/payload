import type { DynamicMigrationTemplate } from 'payload'

import { readdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawIndex } from '../types.js'

type SnapshotIndex = {
  columns?: { expression?: string }[]
  name?: string
}

type SnapshotTable = {
  indexes?: Record<string, SnapshotIndex>
  name?: string
}

const getDefaultIndexName = (name: string): string => {
  const suffix = '_idx'

  return `${name.slice(0, 60 - suffix.length)}${suffix}`
}

const getIndexName = ({
  fallbackFieldName,
  indexes,
  on,
  tableName,
}: {
  fallbackFieldName: string
  indexes?: Record<string, RawIndex>
  on: string
  tableName: string
}): string => {
  const matchingIndex = Object.values(indexes ?? {}).find((index) => index.on === on)

  return matchingIndex?.name ?? getDefaultIndexName(`${tableName}_${fallbackFieldName}`)
}

const getLegacyProcessingIndexName = ({
  filePath,
  tableName,
}: {
  filePath: string
  tableName: string
}): string => {
  const latestSnapshotFile = readdirSync(path.dirname(filePath))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()[0]

  if (latestSnapshotFile) {
    const snapshot = JSON.parse(
      readFileSync(path.join(path.dirname(filePath), latestSnapshotFile), 'utf8'),
    ) as { tables?: Record<string, SnapshotTable> }
    const table = Object.values(snapshot.tables ?? {}).find(({ name }) => name === tableName)
    const processingIndex = Object.values(table?.indexes ?? {}).find((index) =>
      index.columns?.some(({ expression }) => expression === 'processing'),
    )

    if (processingIndex?.name) {
      return processingIndex.name
    }
  }

  return getDefaultIndexName(`${tableName}_processing`)
}

export const buildDynamicPredefinedJobsProcessingLeaseMigration = ({
  dialect,
  packageName,
}: {
  dialect: 'postgres' | 'sqlite'
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as DrizzleAdapter
    const tableName = adapter.tableNameMap.get(toSnakeCase('payload-jobs'))

    if (!tableName) {
      throw new Error('Could not find the payload-jobs database table')
    }

    const rawTable = adapter.rawTables[tableName]
    const newIndexName = getIndexName({
      fallbackFieldName: 'processing_until',
      indexes: rawTable?.indexes,
      on: 'processingUntil',
      tableName,
    })
    const oldIndexName = getLegacyProcessingIndexName({ filePath, tableName })
    const schemaName = dialect === 'postgres' ? (adapter.schemaName ?? 'public') : undefined
    const drizzleSnapshot = await adapter.requireDrizzleKit().generateDrizzleJson(adapter.schema)

    writeFileSync(`${filePath}.json`, JSON.stringify(drizzleSnapshot, null, 2))

    const sharedArgs = `
    db,
    newIndexName: ${JSON.stringify(newIndexName)},
    oldIndexName: ${JSON.stringify(oldIndexName)},
    schemaName: ${JSON.stringify(schemaName)},
    sql,
    tableName: ${JSON.stringify(tableName)},`

    return {
      downSQL: `await migrateJobsProcessingLease({${sharedArgs}
    direction: 'down',
  })`,
      imports: `import { migrateJobsProcessingLease } from '${packageName}/migration-utils'`,
      upSQL: `await migrateJobsProcessingLease({${sharedArgs}
    direction: 'up',
  })`,
    }
  }
}
