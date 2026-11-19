import type { SQL, Table } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { FlattenedArrayField, FlattenedBlocksField, Where } from 'payload'

import { and, eq, exists, sql } from 'drizzle-orm'
import { QueryError } from 'payload'
import { resolveRowContains } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { resolveBlockTableName } from '../utilities/validateExistingBlockIsIdentical.js'
import { getTableAlias } from './getTableAlias.js'
import { parseParams } from './parseParams.js'

export function buildRowContainsCondition({
  adapter,
  aliasTable,
  field,
  locale,
  path,
  tableName,
  where,
}: {
  adapter: DrizzleAdapter
  aliasTable?: Table
  field: FlattenedArrayField | FlattenedBlocksField
  locale?: string
  path: string
  tableName: string
  where: Where
}): SQL {
  if (field.type === 'blocks' && adapter.blocksAsJSON) {
    throw new QueryError([{ path: `${path}.contains` }])
  }

  const rowFilter = resolveRowContains({ blocks: adapter.payload.blocks, field, path, where })

  if (!rowFilter) {
    return sql`false`
  }

  const tablePath = path
    .split('.')
    .slice(0, -1)
    .map((part) => `${part.startsWith('_') ? '_' : ''}${toSnakeCase(part)}`)

  const rowTableName = rowFilter.block
    ? resolveBlockTableName(
        rowFilter.block,
        adapter.tableNameMap.get(`${tableName}_blocks_${toSnakeCase(rowFilter.block.slug)}`),
      )
    : adapter.tableNameMap.get(`${[tableName, ...tablePath, toSnakeCase(field.name)].join('_')}`)
  if (!adapter.tables[rowTableName]) {
    throw new QueryError([{ path: `${path}.contains` }])
  }

  const { newAliasTable: rowTable } = getTableAlias({ adapter, tableName: rowTableName })
  const parentTable = aliasTable ?? adapter.tables[tableName]
  const joins: BuildQueryJoinAliases = []
  const rowWhere = parseParams({
    adapter,
    aliasTable: rowTable,
    context: { sort: undefined },
    fields: rowFilter.flattenedFields,
    joins,
    locale,
    parentIsLocalized: Boolean(rowTable._locale),
    selectFields: {},
    tableName: rowTableName,
    where: rowFilter.where,
  })

  let query = (adapter.drizzle as LibSQLDatabase)
    .select({ id: rowTable.id })
    .from(rowTable)
    .$dynamic()

  for (const { type, condition, table } of joins) {
    query = query[type ?? 'leftJoin'](table, condition)
  }

  return exists(
    query.where(
      and(
        eq(rowTable._parentID, parentTable['id']),
        rowFilter.block ? eq(rowTable._path, path) : undefined,
        rowTable._locale && locale && locale !== 'all' ? eq(rowTable._locale, locale) : undefined,
        rowWhere,
      ),
    ),
  )
}
