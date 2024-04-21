import type { DBQueryConfig } from 'drizzle-orm'
import type { Field, Select } from 'payload/types'

import type { PostgresAdapter } from '../types.js'

import { traverseFields } from './traverseFields.js'

type BuildFindQueryArgs = {
  adapter: PostgresAdapter
  depth: number
  fields: Field[]
  select?: Select
  tableName: string
}

export type Result = DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  depth,
  fields,
  select,
  tableName,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    with: {},
  }

  if (select)
    result.columns = {
      id: true,
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

  if (adapter.tables[`${tableName}_rels`]) {
    result.with._rels = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  if (adapter.tables[`${tableName}_locales`]) {
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
    select,
    topLevelArgs: result,
    topLevelTableName: tableName,
    withSelection: !!select,
  })

  return result
}
