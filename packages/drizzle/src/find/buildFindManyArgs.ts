import type { DBQueryConfig } from 'drizzle-orm'
import type { Field, JoinQuery } from 'payload'

import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js'

import { traverseFields } from './traverseFields.js'

type BuildFindQueryArgs = {
  adapter: DrizzleAdapter
  depth: number
  fields: Field[]
  joinQuery?: JoinQuery
  /**
   * The joins array will be mutated by pushing any joins needed for the where queries of join field joins
   */
  joins?: BuildQueryJoinAliases
  locale?: string
  tableName: string
}

export type Result = {
  with?: {
    _locales?: DBQueryConfig<'many', true, any, any>
  } & DBQueryConfig<'many', true, any, any>
} & DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  depth,
  fields,
  joinQuery,
  joins = [],
  locale,
  tableName,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    extras: {},
    with: {},
  }

  const _locales: Result = {
    columns: {
      id: false,
      _parentID: false,
    },
    extras: {},
    with: {},
  }

  if (adapter.tables[`${tableName}_texts`]) {
    result.with._texts = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (adapter.tables[`${tableName}_numbers`]) {
    result.with._numbers = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (adapter.tables[`${tableName}${adapter.relationshipsSuffix}`]) {
    result.with._rels = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (adapter.tables[`${tableName}${adapter.localesSuffix}`]) {
    result.with._locales = _locales
  }

  traverseFields({
    _locales,
    adapter,
    currentArgs: result,
    currentTableName: tableName,
    depth,
    fields,
    joinQuery,
    joins,
    locale,
    path: '',
    tablePath: '',
    topLevelArgs: result,
    topLevelTableName: tableName,
  })

  return result
}
