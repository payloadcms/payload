import type { DBQueryConfig } from 'drizzle-orm'
import type { FlattenedField, JoinQuery, SelectType } from 'payload'

import { getSelectMode } from 'payload/shared'

import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js'

import { traverseFields } from './traverseFields.js'

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
  versions?: boolean
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
  collectionSlug,
  depth,
  draftsEnabled,
  fields,
  joinQuery,
  joins = [],
  locale,
  select,
  tableName,
  versions,
}: BuildFindQueryArgs): Result => {
  const result: Result = {
    extras: {},
    with: {},
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

  const textsTableName = adapter.getIdentifier({
    type: 'table',
    segments: [tableName, 'texts'],
  })
  if (adapter.tables[textsTableName] && withTabledFields.texts) {
    result.with._texts = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  const numbersTableName = adapter.getIdentifier({
    type: 'table',
    segments: [tableName, 'numbers'],
  })
  if (adapter.tables[numbersTableName] && withTabledFields.numbers) {
    result.with._numbers = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  const relsTableName = adapter.getIdentifier({
    type: 'table',
    segments: [tableName, (adapter.relationshipsSuffix ?? '_rels').replace(/^_/, '')],
  })
  if (adapter.tables[relsTableName] && withTabledFields.rels) {
    result.with._rels = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc: ASC }) => [ASC(order)],
    }
  }

  const localesTableName = adapter.getIdentifier({
    type: 'table',
    segments: [tableName, (adapter.localesSuffix ?? '_locales').replace(/^_/, '')],
  })
  if (adapter.tables[localesTableName] && (!select || Object.keys(_locales.columns).length > 1)) {
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
