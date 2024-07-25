import type { DBIdentifierName } from 'payload/database'

type Args = {
  config: {
    dbName?: DBIdentifierName
    enumName?: DBIdentifierName
    name?: string
    slug?: string
  }
  locales?: boolean
  target?: 'dbName' | 'enumName'
  versions?: boolean
}

/**
 * Used to name database enums and collections
 * Returns the collection or enum name for a given entity
 */
export const getDBName = ({
  config: { name, slug },
  config,
  target = 'dbName',
  versions = false,
}: Args): string => {
  let result: string
  let custom = config[target]

  if (!custom && target === 'enumName') {
    custom = config['dbName']
  }

  if (custom) {
    result = typeof custom === 'function' ? custom({}) : custom
  } else {
    result = name ?? slug
  }

  if (versions) result = `_${result}_versions`

  return result
}
