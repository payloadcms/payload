import type { DBIdentifierName } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

type Args = {
  adapter: Pick<DrizzleAdapter, 'getIdentifier' | 'tableNameMap' | 'versionsSuffix'>
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
  /**
   * @deprecated No longer enforced. `adapter.getIdentifier` emits warnings for
   * user-provided `dbName` / `enumName` values exceeding the database's max
   * identifier length, and compresses segment-derived names when
   * `shouldCompressIdentifiers` is enabled.
   */
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
  versions = false,
  versionsCustomName = false,
}: Args): string => {
  let customNameDefinition = config[target]

  let defaultTableName = `${prefix}${toSnakeCase(name ?? slug)}`

  if (versions) {
    defaultTableName = `_${defaultTableName}${adapter.versionsSuffix}`
  }

  let customTableNameResult: string | undefined

  if (!customNameDefinition && target === 'enumName') {
    customNameDefinition = config['dbName']
  }

  if (customNameDefinition) {
    customTableNameResult =
      typeof customNameDefinition === 'function'
        ? customNameDefinition({ tableName: parentTableName })
        : customNameDefinition

    if (versionsCustomName) {
      customTableNameResult = `_${customTableNameResult}${adapter.versionsSuffix}`
    }
  }

  const type: 'enum' | 'table' = target === 'enumName' ? 'enum' : 'table'

  const result =
    customTableNameResult !== undefined
      ? adapter.getIdentifier({ type, customName: customTableNameResult })
      : adapter.getIdentifier({ type, segments: [defaultTableName] })

  adapter.tableNameMap.set(defaultTableName, result)

  return result
}
