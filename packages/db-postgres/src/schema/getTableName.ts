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
  /** Localized tables need to be given the locales suffix */
  locales?: boolean
  /** For nested tables passed for the user custom dbName functions to handle their own iterations */
  parentTableName?: string
  /** For sub tables (array for example) this needs to include the parentTableName */
  prefix?: string
  /** Adds the relationships suffix */
  relationships?: boolean
  /** For tables based on fields that could have both enumName and dbName (ie: select with hasMany), default: 'dbName' */
  target?: 'dbName' | 'enumName'
  throwValidationError?: boolean
  /** Adds the versions suffix, should only be used on the base collection to duplicate suffixing */
  versions?: boolean
}

/**
 * Used to name database enums and tables
 * Returns the table or enum name for a given entity
 */
export const getTableName = ({
  adapter,
  config: { name, slug },
  config,
  locales = false,
  parentTableName,
  prefix = '',
  relationships = false,
  target = 'dbName',
  throwValidationError = false,
  versions = false,
}: Args): string => {
  let result: string
  let custom = config[target]

  if (!custom && target === 'enumName') {
    custom = config['dbName']
  }

  if (custom) {
    result = typeof custom === 'function' ? custom({ tableName: parentTableName }) : custom
  } else {
    result = `${prefix}${toSnakeCase(name ?? slug)}`
  }

  if (locales) result = `${result}${adapter.localesSuffix}`
  if (versions) result = `_${result}${adapter.versionsSuffix}`
  if (relationships) result = `${result}${adapter.relationshipsSuffix}`

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
