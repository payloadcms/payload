import type { DBIdentifierName } from 'payload/database'

import { APIError } from 'payload/errors'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../types'

type Args = {
  adapter: PostgresAdapter
  /** The collection, global or field config **/
  config: {
    dbName?: DBIdentifierName
    enumName?: DBIdentifierName
    name?: string
    slug?: string
  }
  /** For nested tables passed for the user custom dbName functions to handle their own iterations */
  parentTableName?: string
  /** For sub tables (array for example) this needs to include the parentTableName */
  prefix?: string
  /** For tables based on fields that could have both enumName and dbName (ie: select with hasMany), default: 'dbName' */
  target?: 'dbName' | 'enumName'
  throwValidationError?: boolean
  /** Adds the versions suffix to the default table name - should only be used on the base collection to avoid duplicate suffixing */
  versions?: boolean
  /** Adds the versions suffix to custom dbName only - this is used while creating blocks / selects / arrays / etc */
  versionsCustomName?: boolean
}

/**
 * Used to name database enums and tables
 * Returns the table or enum name for a given entity
 */
export const createTableName = ({
  adapter,
  config: { name, slug },
  config,
  parentTableName,
  prefix = '',
  target = 'dbName',
  throwValidationError = false,
  versions = false,
  versionsCustomName = false,
}: Args): string => {
  let customNameDefinition = config[target]

  let defaultTableName = `${prefix}${toSnakeCase(name ?? slug)}`

  if (versions) defaultTableName = `_${defaultTableName}${adapter.versionsSuffix}`

  let customTableNameResult: string

  if (!customNameDefinition && target === 'enumName') {
    customNameDefinition = config['dbName']
  }

  if (customNameDefinition) {
    customTableNameResult =
      typeof customNameDefinition === 'function'
        ? customNameDefinition({ tableName: parentTableName })
        : customNameDefinition

    if (versionsCustomName)
      customTableNameResult = `_${customTableNameResult}${adapter.versionsSuffix}`
  }

  const result = customTableNameResult || defaultTableName

  adapter.tableNameMap.set(defaultTableName, result)

  if (!throwValidationError) {
    return result
  }

  if (result.length > 63) {
    throw new APIError(
      `Exceeded max identifier length for table or enum name of 63 characters. Invalid name: ${result}`,
    )
  }

  return result
}
