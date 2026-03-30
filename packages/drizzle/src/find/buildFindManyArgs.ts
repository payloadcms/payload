import type { DBQueryConfig, SQL } from 'drizzle-orm'
import type { FlattenedField, JoinQuery, SelectType, Where } from 'payload'

import { getSelectMode } from 'payload/shared'

import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js'

import { traverseFields } from './traverseFields.js'

/**
 * Metadata captured by traverseFields for each polymorphic join field when
 * batch loading is enabled. findMany.ts uses this to execute a single batch
 * query per join field after the main parent query, avoiding N+1 correlated
 * subqueries.
 */
export type PolymorphicJoinInfo = {
  columnName: string
  countColumnName?: string
  // The unsorted UNION SQLSelect built from all child collection tables
  currentQuery: any
  limit: number
  onPath: string
  page?: number
  sortDir: 'ASC' | 'DESC'
  // Pre-built SQL condition for the join's where clause (alias: ${columnName}_pre)
  sqlWhere?: SQL
  where?: Where
}

type BuildFindQueryArgs = {
  adapter: DrizzleAdapter
  collectionSlug?: string
  depth: number
  draftsEnabled?: boolean
  fields: FlattenedField[]
  joinQuery?: JoinQuery
  /**
   * The joins array will be mutated by pushing any joins needed for the where queries of join field joins
   */
  joins?: BuildQueryJoinAliases
  locale?: string
  select?: SelectType
  tableName: string
  /**
   * When true, polymorphic join fields are deferred for batch loading by findMany.ts
   * instead of using per-row correlated subqueries. Only valid for PostgreSQL.
   * Populated into _polymorphicJoins on the returned Result.
   */
  useBatchPolymorphicJoins?: boolean
  versions?: boolean
}

export type Result = {
  /** Populated only when useBatchPolymorphicJoins=true; processed by findMany.ts */
  _polymorphicJoins?: PolymorphicJoinInfo[]
  with?: {
    _locales?: DBQueryConfig<'many', true, any, any>
  } & DBQueryConfig<'many', true, any, any>
} & DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  collectionSlug,
  depth,
  draftsEnabled,
  fields,
  joinQuery,
  joins = [],
  locale,
  select,
  tableName,
  useBatchPolymorphicJoins,
  versions,
}: BuildFindQueryArgs): Result => {
  const result: Result = {
    extras: {},
    with: {},
  }

  if (useBatchPolymorphicJoins && adapter.name === 'postgres') {
    result._polymorphicJoins = []
  }

  if (select) {
    result.columns = {
      id: true,
    }
  }

  const _locales: Result = {
    columns: select
      ? { _locale: true }
      : {
          id: false,
          _parentID: false,
        },
    extras: {},
    with: {},
  }

  const withTabledFields = select
    ? {}
    : {
        numbers: true,
        rels: true,
        texts: true,
      }

  traverseFields({
    _locales,
    adapter,
    collectionSlug,
    currentArgs: result,
    currentTableName: tableName,
    depth,
    draftsEnabled,
    fields,
    joinQuery,
    joins,
    locale,
    path: '',
    select,
    selectMode: select ? getSelectMode(select) : undefined,
    tablePath: '',
    topLevelArgs: result,
    topLevelTableName: tableName,
    versions,
    withTabledFields,
  })

  if (adapter.tables[`${tableName}_texts`] && withTabledFields.texts) {
    result.with._texts = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (adapter.tables[`${tableName}_numbers`] && withTabledFields.numbers) {
    result.with._numbers = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (adapter.tables[`${tableName}${adapter.relationshipsSuffix}`] && withTabledFields.rels) {
    result.with._rels = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (
    adapter.tables[`${tableName}${adapter.localesSuffix}`] &&
    (!select || Object.keys(_locales.columns).length > 1)
  ) {
    result.with._locales = _locales
  }

  // Delete properties that are empty
  for (const key of Object.keys(result)) {
    if (!Object.keys(result[key]).length) {
      delete result[key]
    }
  }

  return result
}
