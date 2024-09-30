import type { DBQueryConfig } from 'drizzle-orm'
import type { Field } from 'payload/types'

import type { PostgresAdapter } from '../types'

import { traverseFields } from './traverseFields'

type BuildFindQueryArgs = {
  adapter: PostgresAdapter
  depth: number
  fields: Field[]
  tableName: string
}

export type Result = DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  depth,
  fields,
  tableName,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    with: {},
  }

  const _locales: Result = {
    columns: {
      id: false,
      _parentID: false,
    },
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
    path: '',
    tablePath: '',
    topLevelArgs: result,
    topLevelTableName: tableName,
  })

  return result
}
