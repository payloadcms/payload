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

  return sort
    .split(',')
    .map((item) => {
      let orderBy: string
      let direction = ''
      if (item[0] === '-') {
        orderBy = item.substring(1)
        direction = '-'
      } else {
        orderBy = item
      }

      if (orderBy === 'id') {
        return `${direction}parent`
      }

      return `${direction}version.${orderBy}`
    })
    .join(',')
}
