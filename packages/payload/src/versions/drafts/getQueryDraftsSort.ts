import type { SanitizedCollectionConfig } from '../../collections/config/types.js'

/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */
export const getQueryDraftsSort = ({
  collectionConfig,
  sort,
}: {
  collectionConfig: SanitizedCollectionConfig
  sort: string
}): string => {
  if (!sort) {
    if (collectionConfig.defaultSort) {
      sort = collectionConfig.defaultSort
    } else {
      sort = '-createdAt'
    }
  }

  let direction = ''
  let orderBy = sort

  if (sort[0] === '-') {
    direction = '-'
    orderBy = sort.substring(1)
  }

  if (orderBy === 'id') {
    return `${direction}parent`
  }

  return `${direction}version.${orderBy}`
}
