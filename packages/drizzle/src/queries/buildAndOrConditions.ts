import type { SQL, Table } from 'drizzle-orm'
import type { FlattenedField, Where } from 'payload'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { parseParams } from './parseParams.js'

export function buildAndOrConditions({
  adapter,
  aliasTable,
  fields,
  joins,
  locale,
  parentIsLocalized,
  selectFields,
  selectLocale,
  tableName,
  where,
}: {
  adapter: DrizzleAdapter
  aliasTable?: Table
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  joins: BuildQueryJoinAliases
  locale?: string
  parentIsLocalized: boolean
  selectFields: Record<string, GenericColumn>
  selectLocale?: boolean
  tableName: string
  where: Where[]
}): SQL[] {
  const completedConditions = []
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array

  for (const condition of where) {
    // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      const result = parseParams({
        adapter,
        aliasTable,
        fields,
        joins,
        locale,
        parentIsLocalized,
        selectFields,
        selectLocale,
        tableName,
        where: condition,
      })
      if (result && Object.keys(result).length > 0) {
        completedConditions.push(result)
      }
    }
  }
  return completedConditions
}
