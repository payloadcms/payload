import type { DBQueryConfig } from 'drizzle-orm'
import type { SanitizedConfig } from 'payload/config'
import type { ArrayField, Block } from 'payload/types'
import type { SanitizedCollectionConfig } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../types.js'

import { buildWithFromDepth } from './buildWithFromDepth.js'
import { createLocaleWhereQuery } from './createLocaleWhereQuery.js'
import { traverseFields } from './traverseFields.js'

type BuildFindQueryArgs = {
  adapter: PostgresAdapter
  collection: SanitizedCollectionConfig
  config: SanitizedConfig
  depth: number
  fallbackLocale?: false | string
  locale?: string
}

export type Result = DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  collection,
  config,
  depth,
  fallbackLocale,
  locale,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    with: {},
  }

  const _locales: Result = {
    columns: {
      _parentID: false,
      id: false,
    },
    where: createLocaleWhereQuery({ fallbackLocale, locale }),
  }

  const tableName = toSnakeCase(collection.slug)

  if (adapter.tables[`${tableName}_relationships`]) {
    result.with._relationships = {
      columns: {
        id: false,
        parent: false,
      },
      orderBy: ({ order }, { asc }) => [asc(order)],
      with: buildWithFromDepth({
        adapter,
        config,
        depth,
        fallbackLocale,
        locale,
      }),
    }
  }

  if (adapter.tables[`${tableName}_locales`]) {
    result.with._locales = _locales
  }

  const locatedBlocks: Block[] = []
  const locatedArrays: { [path: string]: ArrayField } = {}

  traverseFields({
    _locales,
    adapter,
    config,
    currentArgs: result,
    currentTableName: tableName,
    depth,
    fields: collection.fields,
    locatedArrays,
    locatedBlocks,
    path: '',
    topLevelArgs: result,
    topLevelTableName: tableName,
  })

  return result
}
