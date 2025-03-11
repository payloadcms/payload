import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { RelationalQueryBuilder } from 'drizzle-orm/sqlite-core/query-builders/query'
import type { CollectionSlug, GlobalSlug } from 'payload'

import { APIError } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'

export const getCollection = ({
  adapter,
  collectionSlug,
  versions = false,
}: {
  adapter: DrizzleAdapter
  collectionSlug: CollectionSlug
  versions?: boolean
}) => {
  const collection = adapter.payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(`Collection with the slug ${collectionSlug} was not found in the config.`)
  }

  const tableNameKey = versions
    ? `_${toSnakeCase(collection.config.slug)}${adapter.versionsSuffix}`
    : toSnakeCase(collection.config.slug)

  const tableName = adapter.tableNameMap.get(tableNameKey)

  if (!tableName) {
    throw new APIError(
      `Table for collection with the slug ${collectionSlug} ${tableName} was not found.`,
    )
  }

  return {
    collectionConfig: collection.config,
    tableName,
  }
}

export const getGlobal = ({
  adapter,
  globalSlug,
  versions = false,
}: {
  adapter: DrizzleAdapter
  globalSlug: GlobalSlug
  versions?: boolean
}) => {
  const globalConfig = adapter.payload.config.globals.find((each) => each.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`Global with the slug ${globalSlug} was not found in the config.`)
  }

  const tableNameKey = versions
    ? `_${toSnakeCase(globalConfig.slug)}${adapter.versionsSuffix}`
    : toSnakeCase(globalConfig.slug)

  const tableName = adapter.tableNameMap.get(tableNameKey)

  if (!tableName) {
    throw new APIError(`Table for global with the slug ${globalSlug} ${tableName} was not found.`)
  }

  return {
    globalConfig,
    tableName,
  }
}

export const getTableQuery = ({
  adapter,
  tableName,
}: {
  adapter: DrizzleAdapter
  tableName: string
}) => {
  const drizzle = adapter.drizzle
  // @ts-expect-error we don't have drizzle schema types
  const table = drizzle.query[tableName] as RelationalQueryBuilder<any, any, any, any> | undefined

  if (!table) {
    throw new APIError(`Table with the name ${tableName} was not found.`)
  }

  return table
}
