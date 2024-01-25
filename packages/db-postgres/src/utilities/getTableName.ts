import type { CustomName } from 'payload/database'

import toSnakeCase from 'to-snake-case'

type Args = {
  config: {
    dbName?: CustomName
    enumName?: CustomName
    name?: string
    slug?: string
  }
  locales?: boolean
  parentTableName?: string
  prefix?: string
  relationships?: boolean
  target?: 'dbName' | 'enumName'
  versions?: boolean
}

/**
 * Used to name database enums and tables
 * Returns the table or enum name for a given entity
 */
export const getTableName = ({
  config: { name, slug },
  config,
  locales = false,
  parentTableName,
  prefix = '',
  relationships = false,
  target = 'dbName',
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

  if (locales) result = `${result}_locales`
  if (versions) result = `_${result}_v`
  if (relationships) result = `${result}_rels`

  return result
}
