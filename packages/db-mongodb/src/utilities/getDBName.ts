import { APIError, type DBIdentifierName } from 'payload'

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
  let result: null | string = null
  let custom = config[target]

  if (!custom && target === 'enumName') {
    custom = config['dbName']
  }

  if (custom) {
    result = typeof custom === 'function' ? custom({}) : custom
  } else {
    result = name ?? slug ?? null
  }

  if (versions) {
    result = `_${result}_versions`
  }

  if (!result) {
    throw new APIError(`Assertion for DB name of ${name} ${slug} was failed.`)
  }

  return result
}
